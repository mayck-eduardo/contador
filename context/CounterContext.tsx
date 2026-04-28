/**
 * CounterContext — Arquitetura Uniforme
 *
 * Todos os contadores são iguais (DayCounter[]).
 * Não existe mais "contador principal" — todos têm os mesmos direitos.
 *
 * Modos de contagem (CountMode):
 *  - 'streak': dias CONSECUTIVOS. Se perder um dia → volta a 0.
 *  - 'simple': acumula todos os dias marcados (ADD), sem penalidade.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActionType,
  CountMode,
  FrequencyType,
  DailyStatus,
  DayCounter,
  getTodayStr,
  computeCount,
  computeStreak,
  computeSimpleCount,
  getDayCounterStatsStatic,
  XP_PER_COMPLETION,
} from '../utils/counterUtils';
import { getDayCounterStatsStatic as getStats } from '../utils/counterUtils';
import {
  requestNotificationPermissions,
  scheduleDailyEncouragement,
  scheduleCheckinReminder,
  triggerMilestoneNotification,
  cancelAllNotifications,
  scheduleCounterReminder,
  cancelCounterReminder,
} from '../services/NotificationService';
import { WidgetService } from '../services/WidgetService';

// ─── Re-exports para conveniência ───────────────────────────────────────────
export { ActionType, CountMode, FrequencyType, DailyStatus, DayCounter, computeCount, computeStreak, computeSimpleCount };

// ─── Tipos Locais ────────────────────────────────────────────────────────────
export interface AppState {
  dayCounters: DayCounter[];
  notificationsEnabled: boolean;
  notificationHour: number;
  countdownTabEnabled: boolean;
  countdownTargetDate: string | null;
  globalXp: number;
  unlockedAchievements: string[];
}

interface CounterContextType extends AppState {
  isLoading: boolean;
  addDayCounter: (name: string, emoji: string, color: string, mode: CountMode, goalDays: number | null, reminderEnabled?: boolean, reminderHour?: number | null, frequencyType?: FrequencyType, specificDays?: number[]) => void;
  updateDayCounter: (id: string, updates: Partial<Pick<DayCounter, 'name' | 'emoji' | 'color' | 'mode' | 'goalDays' | 'reminderEnabled' | 'reminderHour' | 'frequencyType' | 'specificDays'>>) => void;
  removeDayCounter: (id: string) => void;
  incrementDayCounter: (id: string) => void;
  undoDayCounter: (id: string) => void;
  resetDayCounter: (id: string) => void;
  toggleDateOnCounter: (id: string, date: string) => void;
  getDayCounterStats: (counter: DayCounter) => ReturnType<typeof getDayCounterStatsStatic>;
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationHour: (h: number) => void;
  setCountdownTabEnabled: (v: boolean) => void;
  setCountdownTargetDate: (v: string | null) => void;
  addXp: (amount: number, counterId?: string) => void;
  unlockAchievement: (id: string) => void;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = '@contador_state_v4';
const MILESTONES = [7, 14, 21, 30, 60, 100];

const DEFAULT_STATE: AppState = {
  dayCounters: [],
  notificationsEnabled: true,
  notificationHour: 20,
  countdownTabEnabled: true,
  countdownTargetDate: null,
  globalXp: 0,
  unlockedAchievements: [],
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // ── Carregar e migrar ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);
        let parsed: any = null;

        if (raw) {
          parsed = JSON.parse(raw);
        } else {
          const legacyKeys = ['@contador_state_v3', '@contador_state_v2', '@contador_state'];
          for (const key of legacyKeys) {
            const legacyRaw = await AsyncStorage.getItem(key);
            if (legacyRaw) {
              const legacy = JSON.parse(legacyRaw);
              const existing: DayCounter[] = legacy.dayCounters ?? [];
              const hasMainAsDayCounter = existing.some((c: DayCounter) => c.id === 'main-legacy');

              if (!hasMainAsDayCounter && legacy.dailyStatus && Object.keys(legacy.dailyStatus).length > 0) {
                const mainCounter: DayCounter = {
                  id: 'main-legacy',
                  name: 'Meu Contador',
                  emoji: '⭐',
                  color: '#10B981',
                  mode: legacy.countMode ?? 'streak',
                  startDate: Object.keys(legacy.dailyStatus).sort()[0] ?? getTodayStr(),
                  dailyStatus: legacy.dailyStatus,
                  goalDays: legacy.goalDays ?? 14,
                  lastAction: null,
                };
                existing.unshift(mainCounter);
              }

              parsed = {
                dayCounters: existing,
                notificationsEnabled: legacy.notificationsEnabled ?? true,
                notificationHour: legacy.notificationHour ?? 20,
                countdownTabEnabled: legacy.countdownTabEnabled ?? true,
                countdownTargetDate: legacy.countdownTargetDate ?? null,
              };
              break;
            }
          }
        }

        if (parsed) {
          setState((prev) => ({
            ...prev,
            ...parsed,
            dayCounters: (parsed.dayCounters ?? []).map((c: DayCounter) => ({
              ...c,
              lastAction: c.lastAction ?? null,
              reminderEnabled: c.reminderEnabled ?? false,
              reminderHour: c.reminderHour ?? 20,
            })),
          }));
        }
      } catch (e) {
        console.error('[CounterContext] Falha ao carregar:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Persistir ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.error);
    const first = state.dayCounters[0];
    if (first) {
      const stats = getDayCounterStatsStatic(first);
      WidgetService.updateWidget(stats.count, first.goalDays ?? 0, stats.hasAddedToday, first.mode);
    }
  }, [state, isLoading]);

  // ── Notificações Globais ────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const setup = async () => {
      const granted = await requestNotificationPermissions();
      if (granted && state.notificationsEnabled) {
        await scheduleDailyEncouragement(state.notificationHour, 0, true);
        await scheduleCheckinReminder(true);
      } else {
        await cancelAllNotifications();
      }
    };
    setup();
  }, [state.notificationsEnabled, state.notificationHour, isLoading]);

  // ── Notificações Individuais ────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const updateIndividualReminders = async () => {
      for (const counter of state.dayCounters) {
        if (state.notificationsEnabled && counter.reminderEnabled && typeof counter.reminderHour === 'number') {
          await scheduleCounterReminder(
            counter.id,
            counter.name,
            counter.emoji,
            counter.reminderHour,
            0
          );
        } else {
          await cancelCounterReminder(counter.id);
        }
      }
    };
    updateIndividualReminders();
  }, [state.dayCounters, state.notificationsEnabled, isLoading]);

  // ── Counter actions ────────────────────────────────────────────────────────
  const addDayCounter = (
    name: string,
    emoji: string,
    color: string,
    mode: CountMode,
    goalDays: number | null,
    reminderEnabled: boolean = false,
    reminderHour: number | null = 20,
    frequencyType: FrequencyType = 'daily',
    specificDays?: number[]
  ) => {
    const counter: DayCounter = {
      id: Date.now().toString(),
      name: name.trim() || 'Contador',
      emoji: emoji || '🎯',
      color,
      mode,
      startDate: getTodayStr(),
      dailyStatus: {},
      goalDays,
      lastAction: null,
      reminderEnabled,
      reminderHour,
      frequencyType,
      specificDays,
    };
    setState((p) => ({ ...p, dayCounters: [...p.dayCounters, counter] }));
  };

  const updateDayCounter = (
    id: string,
    updates: Partial<Pick<DayCounter, 'name' | 'emoji' | 'color' | 'mode' | 'goalDays' | 'reminderEnabled' | 'reminderHour' | 'frequencyType' | 'specificDays'>>
  ) =>
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) =>
        c.id !== id ? c : { ...c, ...updates }
      ),
    }));

  const toggleDateOnCounter = (id: string, date: string) =>
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) => {
        if (c.id !== id) return c;
        const newStatus = { ...c.dailyStatus };
        if (newStatus[date] === 'ADD') {
          delete newStatus[date];
        } else {
          newStatus[date] = 'ADD';
        }
        return { ...c, dailyStatus: newStatus };
      }),
    }));

  const removeDayCounter = (id: string) =>
    setState((p) => ({ ...p, dayCounters: p.dayCounters.filter((c) => c.id !== id) }));

  const incrementDayCounter = (id: string) => {
    const today = getTodayStr();
    setState((p) => {
      const updatedCounters: DayCounter[] = p.dayCounters.map((c) => {
        if (c.id !== id || c.dailyStatus[today] === 'ADD') return c;
        const newStatus: DailyStatus = { ...c.dailyStatus, [today]: 'ADD' };
        const newCount = computeCount(newStatus, c.mode);
        if (MILESTONES.includes(newCount) && p.notificationsEnabled) {
          triggerMilestoneNotification(newCount);
        }
        const updated: DayCounter = {
          ...c,
          dailyStatus: newStatus,
          lastAction: { type: 'ADD', date: today, previousStatusOnDate: c.dailyStatus[today] ?? null as any },
        };
        return updated;
      });
      
      const counter = p.dayCounters.find(c => c.id === id);
      if (counter && counter.dailyStatus[today] !== 'ADD') {
        return {
          ...p,
          dayCounters: updatedCounters,
          globalXp: (p.globalXp || 0) + XP_PER_COMPLETION,
        };
      }
      return { ...p, dayCounters: updatedCounters };
    });
  };

  const undoDayCounter = (id: string) => {
    const today = getTodayStr();
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) => {
        if (c.id !== id) return c;
        const last = c.lastAction;
        if (!last || last.date !== today) return c;
        const newStatus = { ...c.dailyStatus };
        if (last.previousStatusOnDate !== null) {
          newStatus[today] = last.previousStatusOnDate;
        } else {
          delete newStatus[today];
        }
        return { ...c, dailyStatus: newStatus, lastAction: null };
      }),
    }));
  };

  const resetDayCounter = (id: string) =>
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) =>
        c.id !== id ? c : { ...c, dailyStatus: {}, lastAction: null }
      ),
    }));

  const getDayCounterStats = (counter: DayCounter) => getDayCounterStatsStatic(counter);

  // ── Data Export/Import ─────────────────────────────────────────────────────
  const exportData = async () => {
    return JSON.stringify(state);
  };

  const importData = async (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.dayCounters) {
        setState(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[CounterContext] Falha ao importar:', e);
      return false;
    }
  };

  // ── Settings ───────────────────────────────────────────────────────────────
  const setNotificationsEnabled = (v: boolean) => setState((p) => ({ ...p, notificationsEnabled: v }));
  const setNotificationHour = (h: number) => setState((p) => ({ ...p, notificationHour: h }));
  const setCountdownTabEnabled = (v: boolean) => setState((p) => ({ ...p, countdownTabEnabled: v }));
  const setCountdownTargetDate = (v: string | null) => setState((p) => ({ ...p, countdownTargetDate: v }));

  // ── XP System ───────────────────────────────────────────────────────────────
  const addXp = (amount: number, _counterId?: string) => {
    setState((p) => ({
      ...p,
      globalXp: (p.globalXp || 0) + amount,
    }));
  };

  const unlockAchievement = (id: string) => {
    setState((p) => {
      if (p.unlockedAchievements?.includes(id)) return p;
      return {
        ...p,
        unlockedAchievements: [...(p.unlockedAchievements || []), id],
      };
    });
  };

  return (
    <CounterContext.Provider
      value={{
        ...state,
        isLoading,
        addDayCounter,
        updateDayCounter,
        removeDayCounter,
        incrementDayCounter,
        undoDayCounter,
        resetDayCounter,
        toggleDateOnCounter,
        getDayCounterStats,
        setNotificationsEnabled,
        setNotificationHour,
        setCountdownTabEnabled,
        setCountdownTargetDate,
        addXp,
        unlockAchievement,
        exportData,
        importData,
      }}
    >
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = () => {
  const ctx = useContext(CounterContext);
  if (!ctx) throw new Error('useCounter must be used within a CounterProvider');
  return ctx;
};

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
import { format, subDays } from 'date-fns';
import {
  requestNotificationPermissions,
  scheduleDailyEncouragement,
  scheduleCheckinReminder,
  triggerMilestoneNotification,
  cancelAllNotifications,
} from '../services/NotificationService';
import { WidgetService } from '../services/WidgetService';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ActionType = 'ADD' | 'RESET';
export type CountMode = 'streak' | 'simple';
export type DailyStatus = Record<string, ActionType>;

export interface LastAction {
  type: ActionType;
  date: string;
  previousStatusOnDate: ActionType | null;
}

export interface DayCounter {
  id: string;
  name: string;
  emoji: string;
  color: string;
  mode: CountMode;
  startDate: string;
  dailyStatus: DailyStatus;
  goalDays: number | null; // null = sem meta
  lastAction: LastAction | null;
}

// ─── Lógica de cálculo (pura, sem efeitos colaterais) ────────────────────────

const getToday = () => format(new Date(), 'yyyy-MM-dd');
const getYesterday = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

/**
 * ⚠️ Usa new Date() e subDays para evitar parse UTC em fuso UTC-3.
 * 'new Date(dateString)' parsearia como UTC midnight → dia errado no Brasil.
 */
export function computeStreak(status: DailyStatus): number {
  const today = getToday();
  const yesterday = getYesterday();

  const startKey = status[today] === 'ADD' ? today : yesterday;
  if (status[startKey] !== 'ADD') return 0;

  let checkDate = new Date();
  if (startKey === yesterday) checkDate = subDays(checkDate, 1);

  let streak = 0;
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (status[dateStr] === 'ADD') {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeSimpleCount(status: DailyStatus): number {
  return Object.values(status).filter((v) => v === 'ADD').length;
}

export function computeCount(status: DailyStatus, mode: CountMode): number {
  return mode === 'streak' ? computeStreak(status) : computeSimpleCount(status);
}

export function computePersonalRecord(status: DailyStatus): number {
  const addDates = Object.keys(status).filter((d) => status[d] === 'ADD').sort();
  if (addDates.length === 0) return 0;
  let maxStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < addDates.length; i++) {
    const prev = new Date(addDates[i - 1]);
    const curr = new Date(addDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }
  return maxStreak;
}

export function computeSuccessRate(status: DailyStatus): number {
  const total = Object.keys(status).length;
  if (total === 0) return 0;
  return Math.round((computeSimpleCount(status) / total) * 100);
}

/** Stats completas de um DayCounter, calculadas ao vivo */
export function getDayCounterStatsStatic(counter: DayCounter) {
  const count = computeCount(counter.dailyStatus, counter.mode);
  const streak = computeStreak(counter.dailyStatus);
  const personalRecord = computePersonalRecord(counter.dailyStatus);
  const successRate = computeSuccessRate(counter.dailyStatus);
  // Se não tem meta, percent = null (sem barra de progresso)
  const percent =
    counter.goalDays !== null && counter.goalDays > 0
      ? Math.min(Math.round((count / counter.goalDays) * 100), 100)
      : null;
  const hasAddedToday = counter.dailyStatus[getToday()] === 'ADD';
  const totalAdds = computeSimpleCount(counter.dailyStatus);
  const canUndo = counter.lastAction !== null && counter.lastAction.date === getToday();
  return { count, streak, personalRecord, successRate, percent, hasAddedToday, totalAdds, canUndo };
}

// ─── Estado da aplicação ──────────────────────────────────────────────────────
export interface AppState {
  dayCounters: DayCounter[];
  // Configurações app
  notificationsEnabled: boolean;
  notificationHour: number;
  countdownTabEnabled: boolean;
  countdownTargetDate: string | null;
}

interface CounterContextType extends AppState {
  isLoading: boolean;
  // Counter CRUD
  addDayCounter: (name: string, emoji: string, color: string, mode: CountMode, goalDays: number | null) => void;
  updateDayCounter: (id: string, updates: Partial<Pick<DayCounter, 'name' | 'emoji' | 'color' | 'mode' | 'goalDays'>>) => void;
  removeDayCounter: (id: string) => void;
  incrementDayCounter: (id: string) => void;
  undoDayCounter: (id: string) => void;
  resetDayCounter: (id: string) => void;
  toggleDateOnCounter: (id: string, date: string) => void;
  getDayCounterStats: (counter: DayCounter) => ReturnType<typeof getDayCounterStatsStatic>;
  // Settings
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationHour: (h: number) => void;
  setCountdownTabEnabled: (v: boolean) => void;
  setCountdownTargetDate: (v: string | null) => void;
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
          // Migração das versões anteriores (v3, v2, v1)
          const legacyKeys = ['@contador_state_v3', '@contador_state_v2', '@contador_state'];
          for (const key of legacyKeys) {
            const legacyRaw = await AsyncStorage.getItem(key);
            if (legacyRaw) {
              const legacy = JSON.parse(legacyRaw);
              // Converte o contador principal legado em um DayCounter
              const existing: DayCounter[] = legacy.dayCounters ?? [];
              const hasMainAsDayCounter = existing.some((c: DayCounter) => c.id === 'main-legacy');

              if (!hasMainAsDayCounter && legacy.dailyStatus && Object.keys(legacy.dailyStatus).length > 0) {
                const mainCounter: DayCounter = {
                  id: 'main-legacy',
                  name: 'Meu Contador',
                  emoji: '⭐',
                  color: '#10B981',
                  mode: legacy.countMode ?? 'streak',
                  startDate: Object.keys(legacy.dailyStatus).sort()[0] ?? getToday(),
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
                watchedApps: legacy.watchedApps ?? [],
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
    // Widget: mostra o primeiro contador
    const first = state.dayCounters[0];
    if (first) {
      const stats = getDayCounterStatsStatic(first);
      WidgetService.updateWidget(stats.count, first.goalDays ?? 0, stats.hasAddedToday, first.mode);
    }
  }, [state, isLoading]);

  // ── Notificações ──────────────────────────────────────────────────────────
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

  // ── Counter actions ────────────────────────────────────────────────────────
  const addDayCounter = (name: string, emoji: string, color: string, mode: CountMode, goalDays: number | null) => {
    const counter: DayCounter = {
      id: Date.now().toString(),
      name: name.trim() || 'Contador',
      emoji: emoji || '🎯',
      color,
      mode,
      startDate: getToday(),
      dailyStatus: {},
      goalDays,
      lastAction: null,
    };
    setState((p) => ({ ...p, dayCounters: [...p.dayCounters, counter] }));
  };

  const updateDayCounter = (
    id: string,
    updates: Partial<Pick<DayCounter, 'name' | 'emoji' | 'color' | 'mode' | 'goalDays'>>
  ) =>
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) =>
        c.id !== id ? c : { ...c, ...updates }
      ),
    }));

  /** Alterna ADD em qualquer data (passada ou hoje). */
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
    const today = getToday();
    setState((p) => ({
      ...p,
      dayCounters: p.dayCounters.map((c) => {
        if (c.id !== id || c.dailyStatus[today] === 'ADD') return c;
        const newStatus: DailyStatus = { ...c.dailyStatus, [today]: 'ADD' };
        const newCount = computeCount(newStatus, c.mode);
        if (MILESTONES.includes(newCount) && p.notificationsEnabled) {
          triggerMilestoneNotification(newCount);
        }
        return {
          ...c,
          dailyStatus: newStatus,
          lastAction: { type: 'ADD', date: today, previousStatusOnDate: c.dailyStatus[today] ?? null },
        };
      }),
    }));
  };

  const undoDayCounter = (id: string) => {
    const today = getToday();
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

  // ── Settings ───────────────────────────────────────────────────────────────
  const setNotificationsEnabled = (v: boolean) => setState((p) => ({ ...p, notificationsEnabled: v }));
  const setNotificationHour = (h: number) => setState((p) => ({ ...p, notificationHour: h }));
  const setCountdownTabEnabled = (v: boolean) => setState((p) => ({ ...p, countdownTabEnabled: v }));
  const setCountdownTargetDate = (v: string | null) => setState((p) => ({ ...p, countdownTargetDate: v }));

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

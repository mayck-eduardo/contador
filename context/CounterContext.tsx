import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import {
  requestNotificationPermissions,
  scheduleDailyEncouragement,
  scheduleCheckinReminder,
  triggerResetNotification,
  triggerMilestoneNotification,
  cancelAllNotifications,
} from '../services/NotificationService';
import { WidgetService } from '../services/WidgetService';

export type ActionType = 'ADD' | 'RESET';

export type DailyStatus = {
  [date: string]: ActionType;
};

export interface LastAction {
  type: ActionType;
  previousCount: number;
  date: string;
  previousDailyStatusAction?: ActionType | null;
}

export interface WatchedApp {
  id: string;
  name: string;
}

export interface CounterState {
  totalCount: number;
  dailyStatus: DailyStatus;
  lastAction: LastAction | null;
  targetDate: string | null;
  countdownTargetDate: string | null;
  notificationsEnabled: boolean;
  notificationHour: number;
  watchedApps: WatchedApp[];
  goalDays: number; // 7 | 14 | 30 | 60 | 100
}

interface CounterContextType extends CounterState {
  addAction: () => void;
  resetAction: () => void;
  undoAction: () => void;
  setTargetDate: (date: string | null) => void;
  setCountdownTargetDate: (date: string | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationHour: (hour: number) => void;
  addWatchedApp: (name: string) => void;
  removeWatchedApp: (id: string) => void;
  setGoalDays: (days: number) => void;
  // computed
  personalRecord: number;
  currentStreak: number;
  successRate: number;
  isLoading: boolean;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = '@contador_state_v2';
const getToday = () => format(new Date(), 'yyyy-MM-dd');
const MILESTONES = [7, 14, 21, 30, 60, 100];

/** Calculate the current streak and personal record from dailyStatus */
function computeStreakStats(dailyStatus: DailyStatus): { currentStreak: number; personalRecord: number } {
  const addDates = Object.keys(dailyStatus)
    .filter((d) => dailyStatus[d] === 'ADD')
    .sort();

  if (addDates.length === 0) return { currentStreak: 0, personalRecord: 0 };

  let maxStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < addDates.length; i++) {
    const prev = new Date(addDates[i - 1]);
    const curr = new Date(addDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }

  // Current streak: count backwards from today
  const today = getToday();
  let streak = 0;
  let checkDate = new Date(today);
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (dailyStatus[dateStr] === 'ADD') {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak: streak, personalRecord: maxStreak };
}

export const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CounterState>({
    totalCount: 0,
    dailyStatus: {},
    lastAction: null,
    targetDate: null,
    countdownTargetDate: null,
    notificationsEnabled: true,
    notificationHour: 20,
    watchedApps: [],
    goalDays: 14,
  });
  const [isLoading, setIsLoading] = useState(true);

  // derived stats
  const { currentStreak, personalRecord } = useMemo(
    () => computeStreakStats(state.dailyStatus),
    [state.dailyStatus]
  );

  const successRate = useMemo(() => {
    const total = Object.keys(state.dailyStatus).length;
    if (total === 0) return 0;
    const adds = Object.values(state.dailyStatus).filter((v) => v === 'ADD').length;
    return Math.round((adds / total) * 100);
  }, [state.dailyStatus]);

  // Load from AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState((prev) => ({
            ...prev,
            ...parsed,
            notificationsEnabled: parsed.notificationsEnabled ?? true,
            notificationHour: parsed.notificationHour ?? 20,
            watchedApps: parsed.watchedApps ?? [],
            goalDays: parsed.goalDays ?? 14,
          }));
        } else {
          // Try migrating from old key
          const old = await AsyncStorage.getItem('@contador_state');
          if (old) {
            const parsed = JSON.parse(old);
            setState((prev) => ({
              ...prev,
              ...parsed,
              notificationsEnabled: parsed.notificationsEnabled ?? true,
              notificationHour: parsed.notificationHour ?? 20,
              watchedApps: parsed.watchedApps ?? [],
              goalDays: parsed.goalDays ?? 14,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load state', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Schedule notifications when settings change
  useEffect(() => {
    if (isLoading) return;
    const setup = async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyEncouragement(state.notificationHour, 0, state.notificationsEnabled);
        await scheduleCheckinReminder(state.notificationsEnabled);
      }
      if (!state.notificationsEnabled) {
        await cancelAllNotifications();
      }
    };
    setup();
  }, [state.notificationsEnabled, state.notificationHour, isLoading]);

  // Persist state
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.error);
      const today = getToday();
      const hasAddedToday = state.dailyStatus[today] === 'ADD';
      WidgetService.updateWidget(state.totalCount, state.goalDays, hasAddedToday);
    }
  }, [state.totalCount, state.goalDays, state.dailyStatus, isLoading]);

  const addAction = () => {
    const today = getToday();
    if (state.dailyStatus[today] === 'ADD') return;

    setState((prev) => {
      const newCount = prev.totalCount + 1;
      if (MILESTONES.includes(newCount) && prev.notificationsEnabled) {
        triggerMilestoneNotification(newCount);
      }
      return {
        ...prev,
        totalCount: newCount,
        dailyStatus: { ...prev.dailyStatus, [today]: 'ADD' },
        lastAction: {
          type: 'ADD',
          previousCount: prev.totalCount,
          date: today,
          previousDailyStatusAction: prev.dailyStatus[today] || null,
        },
      };
    });
  };

  const resetAction = () => {
    const today = getToday();
    setState((prev) => {
      if (prev.notificationsEnabled) triggerResetNotification();
      return {
        ...prev,
        totalCount: 0,
        dailyStatus: { ...prev.dailyStatus, [today]: 'RESET' },
        lastAction: {
          type: 'RESET',
          previousCount: prev.totalCount,
          date: today,
          previousDailyStatusAction: prev.dailyStatus[today] || null,
        },
      };
    });
  };

  const undoAction = () => {
    const today = getToday();
    setState((prev) => {
      const last = prev.lastAction;
      if (!last || last.date !== today) return prev;
      const newStatus = { ...prev.dailyStatus };
      if (last.previousDailyStatusAction) {
        newStatus[today] = last.previousDailyStatusAction;
      } else {
        delete newStatus[today];
      }
      return { ...prev, totalCount: last.previousCount, dailyStatus: newStatus, lastAction: null };
    });
  };

  const setTargetDate = (date: string | null) =>
    setState((p) => ({ ...p, targetDate: date }));

  const setCountdownTargetDate = (date: string | null) =>
    setState((p) => ({ ...p, countdownTargetDate: date }));

  const setNotificationsEnabled = (enabled: boolean) =>
    setState((p) => ({ ...p, notificationsEnabled: enabled }));

  const setNotificationHour = (hour: number) =>
    setState((p) => ({ ...p, notificationHour: hour }));

  const addWatchedApp = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((p) => ({
      ...p,
      watchedApps: [...p.watchedApps, { id: Date.now().toString(), name: trimmed }],
    }));
  };

  const removeWatchedApp = (id: string) =>
    setState((p) => ({ ...p, watchedApps: p.watchedApps.filter((a) => a.id !== id) }));

  const setGoalDays = (days: number) =>
    setState((p) => ({ ...p, goalDays: days }));

  return (
    <CounterContext.Provider
      value={{
        ...state,
        addAction,
        resetAction,
        undoAction,
        setTargetDate,
        setCountdownTargetDate,
        setNotificationsEnabled,
        setNotificationHour,
        addWatchedApp,
        removeWatchedApp,
        setGoalDays,
        personalRecord,
        currentStreak,
        successRate,
        isLoading,
      }}
    >
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = () => {
  const context = useContext(CounterContext);
  if (!context) throw new Error('useCounter must be used within a CounterProvider');
  return context;
};

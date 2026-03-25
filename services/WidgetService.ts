import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { CounterWidget } from '../widgets/CounterWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const STORAGE_KEY = '@contador_state_v4';
type CountMode = 'streak' | 'simple';

// Recalcula o totalCount a partir do dailyStatus — mesma lógica do contexto,
// sem depender de campos derivados serializados.
function computeCount(dailyStatus: Record<string, string>, mode: CountMode): number {
  if (mode === 'simple') {
    return Object.values(dailyStatus).filter((v) => v === 'ADD').length;
  }

  // streak: caminha de hoje (ou ontem) para trás em hora local
  // ⚠️ não usamos new Date(string) para evitar parse UTC em fuso UTC-3
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');

  const startDateKey = dailyStatus[todayStr] === 'ADD' ? todayStr : yesterdayStr;
  if (dailyStatus[startDateKey] !== 'ADD') return 0;

  let checkDate = new Date();
  if (startDateKey === yesterdayStr) {
    checkDate = yesterdayDate;
  }

  let streak = 0;
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (dailyStatus[dateStr] === 'ADD') {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000); // subtrair 1 dia
    } else {
      break;
    }
  }
  return streak;
}

export class WidgetService {
  static async updateWidget(
    totalCount: number,
    goalDays: number,
    hasAddedToday: boolean,
    countMode: CountMode = 'streak'
  ) {
    try {
      if (!requestWidgetUpdate) return;
      requestWidgetUpdate({
        widgetName: 'CounterWidget',
        renderWidget: () =>
          React.createElement(CounterWidget, { totalCount, goalDays, hasAddedToday, countMode }),
      });
    } catch (error) {
      console.warn(
        'Skipping widget update (likely Expo Go or missing native modules):',
        error
      );
    }
  }

  static async handleWidgetAction(action: string) {
    const STORAGE_KEY = '@contador_state_v3';
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        const today = format(new Date(), 'yyyy-MM-dd');
        const countMode: CountMode = state.countMode ?? 'streak';
        const dailyStatus: Record<string, string> = state.dailyStatus ?? {};

        if (action === 'INCREMENT_COUNTER') {
          if (dailyStatus[today] !== 'ADD') {
            dailyStatus[today] = 'ADD';
            state.dailyStatus = dailyStatus;
            state.lastAction = {
              type: 'ADD',
              date: today,
              previousStatusOnDate: null,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          }
          const count = computeCount(dailyStatus, countMode);
          await this.updateWidget(count, state.goalDays ?? 14, true, countMode);
        } else if (
          action === 'WIDGET_ADDED' ||
          action === 'WIDGET_UPDATE' ||
          action === 'WIDGET_RESIZED'
        ) {
          const hasAddedToday = dailyStatus[today] === 'ADD';
          const count = computeCount(dailyStatus, countMode);
          await this.updateWidget(count, state.goalDays ?? 14, hasAddedToday, countMode);
        }
      } else if (action === 'WIDGET_ADDED' || action === 'WIDGET_UPDATE') {
        await this.updateWidget(0, 14, false, 'streak');
      }
    } catch (error) {
      console.error('[WidgetService] Falha ao processar ação do widget:', error);
    }
  }
}

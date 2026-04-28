import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import CounterWidget from '../widgets/CounterWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CountMode, 
  computeCount, 
  getDayCounterStatsStatic,
  DayCounter
} from '../utils/counterUtils';

const STORAGE_KEY = '@contador_state_v4';

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
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        const dayCounters: DayCounter[] = state.dayCounters ?? [];
        const first = dayCounters[0];

        if (!first) return;

        if (action === 'INCREMENT_COUNTER') {
          // Incrementa o primeiro contador (padrão do widget atual)
          const today = new Date().toISOString().slice(0, 10);
          if (first.dailyStatus[today] !== 'ADD') {
            first.dailyStatus[today] = 'ADD';
            first.lastAction = {
              type: 'ADD',
              date: today,
              previousStatusOnDate: null,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          }
          const stats = getDayCounterStatsStatic(first);
          await this.updateWidget(stats.count, first.goalDays ?? 0, stats.hasAddedToday, first.mode);
        } else if (
          action === 'WIDGET_ADDED' ||
          action === 'WIDGET_UPDATE' ||
          action === 'WIDGET_RESIZED'
        ) {
          const stats = getDayCounterStatsStatic(first);
          await this.updateWidget(stats.count, first.goalDays ?? 0, stats.hasAddedToday, first.mode);
        }
      } else if (action === 'WIDGET_ADDED' || action === 'WIDGET_UPDATE') {
        await this.updateWidget(0, 0, false, 'streak');
      }
    } catch (error) {
      console.error('[WidgetService] Falha ao processar ação do widget:', error);
    }
  }
}

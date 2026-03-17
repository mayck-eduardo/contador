import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { CounterWidget } from '../widgets/CounterWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export class WidgetService {
  static async updateWidget(totalCount: number, goalDays: number, hasAddedToday: boolean) {
    try {
      // Safely check if widget updating is supported
      if (!requestWidgetUpdate) {
        return;
      }
      
      requestWidgetUpdate({
        widgetName: 'CounterWidget',
        renderWidget: () => React.createElement(CounterWidget, { totalCount, goalDays, hasAddedToday }),
      });
    } catch (error) {
      // In Expo Go, requestWidgetUpdate throws an exception about missing native modules
      console.warn('Skipping widget update (likely running in Expo Go or missing native modules):', error);
    }
  }

  static async handleWidgetAction(action: string) {
    const STORAGE_KEY = '@contador_state_v2';
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const today = format(new Date(), 'yyyy-MM-dd');
        
        if (action === 'INCREMENT_COUNTER') {
          const alreadyAdded = state.dailyStatus[today] === 'ADD';

          if (!alreadyAdded) {
            state.totalCount += 1;
            state.dailyStatus[today] = 'ADD';
            state.lastAction = {
              type: 'ADD',
              previousCount: state.totalCount - 1,
              date: today,
            previousDailyStatusAction: state.dailyStatus[today] || null,
          };

          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          await this.updateWidget(state.totalCount, state.goalDays, true);
        }
      } else if (action === 'WIDGET_ADDED' || action === 'WIDGET_UPDATE' || action === 'WIDGET_RESIZED') {
        // Render current state when widget is added or periodically updated
        const hasAddedToday = state.dailyStatus?.[today] === 'ADD';
        
        // Auto-reset check for widget: did they miss yesterday?
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        let currentTotalCount = state.totalCount ?? 0;
        if (!hasAddedToday && state.dailyStatus?.[yesterday] !== 'ADD' && Object.keys(state.dailyStatus || {}).length > 0) {
            // Widget auto-detected a missed streak.
            currentTotalCount = 0;
        }
        
        await this.updateWidget(currentTotalCount, state.goalDays ?? 365, hasAddedToday);
      }
    } else if (action === 'WIDGET_ADDED' || action === 'WIDGET_UPDATE') {
          // Render empty state
          await this.updateWidget(0, 365, false);
      }
    } catch (error) {
      console.error('Failed to handle widget background action:', error);
    }
  }
}

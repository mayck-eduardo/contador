import { requestWidgetUpdate } from 'react-native-android-widget';
import { CounterWidget } from '../widgets/CounterWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export class WidgetService {
  static async updateWidget(totalCount: number, goalDays: number, hasAddedToday: boolean) {
    try {
      requestWidgetUpdate({
        widgetName: 'CounterWidget',
        renderWidget: () => CounterWidget({ totalCount, goalDays, hasAddedToday }),
      });
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  }

  static async handleWidgetAction(action: string) {
    if (action === 'INCREMENT_COUNTER') {
      const STORAGE_KEY = '@contador_state_v2';
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = JSON.parse(stored);
          const today = format(new Date(), 'yyyy-MM-dd');
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
        }
      } catch (error) {
        console.error('Failed to handle widget background action:', error);
      }
    }
  }
}

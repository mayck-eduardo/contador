import { registerWidget } from 'react-native-android-widget';
import { CounterWidget } from './CounterWidget';
import { WidgetService } from '../services/WidgetService';

export function registerWidgets() {
  registerWidget('CounterWidget', CounterWidget);
}

export async function widgetTaskHandler(props: any) {
  if (props.clickAction) {
    await WidgetService.handleWidgetAction(props.clickAction);
  }
}

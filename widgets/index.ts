import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { WidgetService } from '../services/WidgetService';

export async function widgetTaskHandler(props: any) {
  if (props.clickAction) {
    await WidgetService.handleWidgetAction(props.clickAction);
  }
}

// Registra o handler quando o app inicia
registerWidgetTaskHandler(widgetTaskHandler);

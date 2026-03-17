import { WidgetService } from '../services/WidgetService';

export async function widgetTaskHandler(props: any) {
  if (props.clickAction) {
    await WidgetService.handleWidgetAction(props.clickAction);
  }
}

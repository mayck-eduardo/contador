import 'expo-router/entry-classic';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { registerWidgets, widgetTaskHandler } from './widgets';

// Register widget layouts
registerWidgets();

// Register background task handler
registerWidgetTaskHandler(widgetTaskHandler);

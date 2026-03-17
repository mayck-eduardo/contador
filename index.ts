import 'react-native-gesture-handler';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets';

// Register widgets early to ensure they are available to the system
try {
  registerWidgetTaskHandler(widgetTaskHandler);
} catch (error) {
  console.warn('Failed to register widget task handler.', error);
}

// Initialize Expo Router
import 'expo-router/entry';

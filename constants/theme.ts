import { Platform } from 'react-native';

// Unified brand palette
export const Palette = {
  // Zinc (backgrounds)
  zinc950: '#09090B',
  zinc900: '#18181B',
  zinc800: '#27272A',
  zinc700: '#3F3F46',
  zinc500: '#71717A',
  zinc400: '#A1A1AA',
  zinc50:  '#FAFAFA',
  // Emerald (primary / success)
  emerald950: '#022c22',
  emerald900: '#042F2E',
  emerald800: '#065F46',
  emerald500: '#10B981',
  emerald400: '#34D399',
  // Red (danger / reset)
  red950: '#450A0A',
  red800: '#7F1D1D',
  red400: '#F87171',
  red500: '#EF4444',
  // Indigo (accent)
  indigo950: '#1E1B4B',
  indigo900: '#1e1b4b',
  indigo800: '#312E81',
  indigo400: '#818CF8',
  indigo300: '#A5B4FC',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: Palette.emerald500,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: Palette.emerald500,
  },
  dark: {
    text: Palette.zinc50,
    background: Palette.zinc950,
    tint: Palette.emerald500,
    icon: Palette.zinc400,
    tabIconDefault: Palette.zinc500,
    tabIconSelected: Palette.emerald500,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});


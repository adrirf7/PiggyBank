/**
 * App colors - Dark mode only
 */

import { Platform } from "react-native";

export const PRIMARY = "#c9e259";
export const INCOME_COLOR = "#22C55E";
export const EXPENSE_COLOR = "#EF4444";

export const Colors = {
  dark: {
    text: "#F1F5F9",
    background: "#0F172A",
    card: "#1E293B",
    border: "#334155",
    muted: "#94A3B8",
    tint: PRIMARY,
    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: PRIMARY,
    tabBar: "#1E293B",
    inputBackground: "#0F172A",
    inputBorder: "#334155",
    buttonSecondary: "#334155",
    buttonSecondaryText: "#F1F5F9",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

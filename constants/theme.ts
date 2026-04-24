import { Platform } from "react-native";

export const PRIMARY = "#5DA8FF";
export const INCOME_COLOR = "#22C55E";
export const EXPENSE_COLOR = "#EF4444";

export const Colors = {
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    card: "#181a1a",
    cardElevated: "#222222",
    border: "#2a2a2a",
    muted: "#8E8E93",
    tint: PRIMARY,
    icon: "#8E8E93",
    tabIconDefault: "#48484A",
    tabIconSelected: PRIMARY,
    tabBar: "rgba(27,27,27,0.97)",
    inputBackground: "#181a1a",
    inputBorder: "#2a2a2a",
    buttonSecondary: "#181a1a",
    buttonSecondaryText: "#FFFFFF",
    cardHighlight: "rgba(255,255,255,0.06)",
    cardGlow: "rgba(93,168,255,0.06)",
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

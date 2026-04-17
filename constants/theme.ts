import { Platform } from "react-native";

export const PRIMARY = "#5DA8FF";
export const INCOME_COLOR = "#22C55E";
export const EXPENSE_COLOR = "#EF4444";

export const Colors = {
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    card: "#111111",
    cardElevated: "#1A1A1A",
    border: "#1E1E1E",
    muted: "#606060",
    tint: PRIMARY,
    icon: "#606060",
    tabIconDefault: "#424242",
    tabIconSelected: PRIMARY,
    tabBar: "rgba(5,5,5,0.97)",
    inputBackground: "#111111",
    inputBorder: "#1E1E1E",
    buttonSecondary: "#161616",
    buttonSecondaryText: "#FFFFFF",
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

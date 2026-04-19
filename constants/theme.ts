import { Platform } from "react-native";

export const PRIMARY = "#5DA8FF";
export const INCOME_COLOR = "#22C55E";
export const EXPENSE_COLOR = "#EF4444";

export const Colors = {
  dark: {
    text: "#FFFFFF",
    background: "#00020C",
    card: "#0D0D14",
    cardElevated: "#14141E",
    border: "#1C1C2A",
    muted: "#606070",
    tint: PRIMARY,
    icon: "#606070",
    tabIconDefault: "#424250",
    tabIconSelected: PRIMARY,
    tabBar: "rgba(3,3,10,0.97)",
    inputBackground: "#0D0D14",
    inputBorder: "#1C1C2A",
    buttonSecondary: "#12121A",
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

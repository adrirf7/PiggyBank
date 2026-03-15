/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const PRIMARY = "#cff916";
export const INCOME_COLOR = "#22C55E";
export const EXPENSE_COLOR = "#EF4444";

export const Colors = {
  light: {
    text: "#0F172A",
    background: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    muted: "#64748B",
    tint: PRIMARY,
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: PRIMARY,
    tabBar: "#FFFFFF",
  },
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
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

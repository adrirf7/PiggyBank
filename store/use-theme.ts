import { create } from "zustand";

interface ThemeStore {
  actualTheme: "dark";
}

export const useThemeStore = create<ThemeStore>(() => ({
  actualTheme: "dark",
}));

// No-op for compatibility
export function useInitializeTheme() {
  // Theme is now always dark, no initialization needed
}

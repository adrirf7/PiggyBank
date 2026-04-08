import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "system",
  actualTheme: Appearance.getColorScheme() === "dark" ? "dark" : "light",
  setTheme: async (theme: Theme) => {
    set({ theme });
    await AsyncStorage.setItem("app-theme", theme);

    const systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
    const actual = theme === "system" ? systemScheme : theme;
    set({ actualTheme: actual });
  },
}));

// Load theme from storage on app start
export function useInitializeTheme() {
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("app-theme");
        if (saved === "light" || saved === "dark" || saved === "system") {
          useThemeStore.getState().setTheme(saved);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadTheme();

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === "system") {
        useThemeStore.setState({
          actualTheme: colorScheme === "dark" ? "dark" : "light",
        });
      }
    });

    return () => subscription.remove();
  }, []);
}

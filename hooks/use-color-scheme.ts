import { useThemeStore } from "@/store/use-theme";

export function useColorScheme() {
  return useThemeStore((state) => state.actualTheme);
}

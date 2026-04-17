import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { AlertDialogProvider } from "@/components/alert-dialog";
import { Colors, PRIMARY } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/auth";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const unstable_settings = {
  anchor: "(tabs)",
};

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.card,
    border: Colors.dark.border,
    text: Colors.dark.text,
    primary: PRIMARY,
    notification: PRIMARY,
  },
};

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  return null;
}

function RootNavigator() {
  const reducedMotion = useReducedMotion();

  return (
    <GestureHandlerRootView className="dark flex-1">
      <ThemeProvider value={navigationTheme}>
        <AlertDialogProvider>
          <AuthGate />
          <Stack screenOptions={{ animation: reducedMotion ? "none" : "fade_from_bottom" }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade" }} />
            <Stack.Screen name="add-transaction" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="manage-categories" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="edit-profile" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="savings-goals" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade_from_bottom" }} />
            <Stack.Screen name="add-goal" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="manage-goal" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade_from_bottom" }} />
            <Stack.Screen name="add-goal-contribution" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
          </Stack>
          <StatusBar style="light" />
        </AlertDialogProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

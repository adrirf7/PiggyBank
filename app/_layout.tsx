import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { AlertDialogProvider } from "@/components/alert-dialog";
import { AuthProvider, useAuth } from "@/context/auth";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const unstable_settings = {
  anchor: "(tabs)",
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
    <View className="dark flex-1">
      <ThemeProvider value={DarkTheme}>
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
          <StatusBar style="auto" />
        </AlertDialogProvider>
      </ThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

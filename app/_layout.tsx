import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import "../global.css";

import { AlertDialogProvider } from "@/components/alert-dialog";
import { getCardTheme } from "@/constants/card-themes";
import { Colors, PRIMARY } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/auth";
import { AccountProvider, useAccount } from "@/context/account";
import { TabScrollProvider, useTabScrollY } from "@/context/tab-scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const SCREEN_H = Dimensions.get("window").height;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  const { accounts, activeAccountId } = useAccount();
  const { userProfile } = useAuth();
  const tabScrollY = useTabScrollY();

  const hasBackgroundImage = !!(userProfile?.backgroundImageId && userProfile.backgroundImageId !== "none");

  const bgGradientColors = useMemo(() => {
    const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
    if (!active) return ["transparent", "transparent"] as const;
    const c = getCardTheme(active.themeId).bgColor;
    return [hexToRgba(c, 0.55), hexToRgba(c, 0.28), hexToRgba(c, 0.05), "transparent"] as const;
  }, [accounts, activeAccountId]);

  const gradientParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -tabScrollY.value * 0.35 }],
  }));

  return (
    <GestureHandlerRootView className="dark flex-1">
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#090909" }]} />
      {!hasBackgroundImage && (
        <Animated.View style={[styles.gradient, gradientParallaxStyle]} pointerEvents="none">
          <LinearGradient
            colors={bgGradientColors}
            locations={[0, 0.30, 0.55, 0.75]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      )}
      <ThemeProvider value={navigationTheme}>
        <AlertDialogProvider>
          <AuthGate />
          <Stack screenOptions={{ animation: reducedMotion ? "none" : "fade_from_bottom" }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade" }} />
            <Stack.Screen name="add-transaction" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="manage-categories" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="manage-accounts" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="edit-profile" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="savings-goals" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade_from_bottom" }} />
            <Stack.Screen name="add-goal" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="manage-goal" options={{ headerShown: false, animation: reducedMotion ? "none" : "fade_from_bottom" }} />
            <Stack.Screen name="add-goal-contribution" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
            <Stack.Screen name="customize-profile" options={{ presentation: "modal", headerShown: false, animation: reducedMotion ? "none" : "slide_from_bottom" }} />
          </Stack>
          <StatusBar style="light" />
        </AlertDialogProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <AccountProvider>
        <TabScrollProvider>
          <RootNavigator />
        </TabScrollProvider>
      </AccountProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H,
  },
});

import { createNavigatorFactory, TabRouter, useNavigationBuilder } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { withLayoutContext } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { Text } from "@/components/text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPEABLE = ["index", "transactions", "analytics", "profile"];

const TAB_ITEMS = [
  { name: "index", title: "Inicio", icon: "home-outline" as const, iconFocused: "home" as const, size: 21 },
  { name: "transactions", title: "Movimientos", icon: "layers-outline" as const, iconFocused: "layers" as const, size: 21 },
  { name: "analytics", title: "Análisis", icon: "stats-chart-outline" as const, iconFocused: "stats-chart" as const, size: 20 },
  { name: "profile", title: "Perfil", icon: "person-outline" as const, iconFocused: "person" as const, size: 21 },
];

function SwipeTabNavigator({ children, screenOptions, initialRouteName }: any) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(
    TabRouter as any,
    { children, screenOptions, initialRouteName },
  );

  const swipeableRoutes = state.routes.filter((r) => SWIPEABLE.includes(r.name));
  const currentRoute = state.routes[state.index];
  const swipeableIndex = Math.max(0, swipeableRoutes.findIndex((r) => r.key === currentRoute?.key));

  const translateX = useSharedValue(-swipeableIndex * SCREEN_WIDTH);
  const activeIndex = useSharedValue(swipeableIndex);

  useEffect(() => {
    activeIndex.value = swipeableIndex;
    translateX.value = withSpring(-swipeableIndex * SCREEN_WIDTH, { damping: 32, stiffness: 200, mass: 0.7 });
  }, [swipeableIndex]);

  const navigateTo = (idx: number) => {
    const route = swipeableRoutes[idx];
    if (route) navigation.navigate(route.name);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      const base = -activeIndex.value * SCREEN_WIDTH;
      const atStart = activeIndex.value === 0 && e.translationX > 0;
      const atEnd = activeIndex.value === swipeableRoutes.length - 1 && e.translationX < 0;
      const resistance = atStart || atEnd ? 0.25 : 1;
      translateX.value = base + e.translationX * resistance;
    })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH * 0.28;
      const velocity = e.velocityX;
      let next = activeIndex.value;

      if ((e.translationX < -threshold || velocity < -600) && next < swipeableRoutes.length - 1) next += 1;
      else if ((e.translationX > threshold || velocity > 600) && next > 0) next -= 1;

      activeIndex.value = next;
      translateX.value = withSpring(-next * SCREEN_WIDTH, { damping: 32, stiffness: 200, mass: 0.7 });

      if (next !== swipeableIndex) runOnJS(navigateTo)(next);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Tab bar layout
  const tabBarHeight = Platform.OS === "ios" ? 58 : 54;
  const tabBarBottom = Platform.OS === "ios" ? Math.max(insets.bottom, 20) : 16;
  const tabBarTotalHeight = tabBarHeight + (Platform.OS !== "ios" ? insets.bottom : 0);
  const pillBottom = tabBarBottom + 20;

  const handleTabPress = (tabIdx: number) => {
    const route = swipeableRoutes[tabIdx];
    if (!route) return;
    const isFocused = swipeableIndex === tabIdx;
    if (isFocused) return;
    // Animate immediately on press, navigate in parallel
    activeIndex.value = tabIdx;
    translateX.value = withSpring(-tabIdx * SCREEN_WIDTH, { damping: 32, stiffness: 200, mass: 0.7 });
    const event = (navigation as any).emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) (navigation as any).navigate(route.name);
  };

  const renderTab = (item: (typeof TAB_ITEMS)[number], tabIdx: number) => {
    const isFocused = swipeableIndex === tabIdx;
    return (
      <TouchableOpacity key={item.name} style={styles.tabItem} onPress={() => handleTabPress(tabIdx)} activeOpacity={0.7}>
        <View style={[styles.bubble, isFocused && styles.activeBubble]}>
          <Ionicons name={isFocused ? item.iconFocused : item.icon} size={item.size} color="#FFFFFF" />
          <Text style={[styles.tabLabel, { color: isFocused ? "#FFFFFF" : "#666670" }]}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <NavigationContent>
      <View style={{ flex: 1, overflow: "hidden" }}>

        {/* ── Fondo estático global (se renderiza una vez, el contenido desliza encima) ── */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000000" }]} />

        {/* ── Pager (solo el contenido desliza) ── */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ flex: 1, flexDirection: "row", width: SCREEN_WIDTH * swipeableRoutes.length }, animatedStyle]}>
            {swipeableRoutes.map((route) => (
              <View key={route.key} style={{ width: SCREEN_WIDTH, flex: 1, overflow: "hidden" }}>
                {descriptors[route.key].render()}
              </View>
            ))}
          </Animated.View>
        </GestureDetector>

        {/* Gradient */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.95)"]}
          pointerEvents="none"
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, zIndex: 5 }}
        />

        {/* Pill tab bar */}
        <View
          style={[
            styles.pill,
            { bottom: pillBottom, height: tabBarTotalHeight, paddingBottom: Platform.OS === "ios" ? 6 : 4 + insets.bottom },
          ]}
        >
          {TAB_ITEMS.map((item, i) => renderTab(item, i))}
        </View>
      </View>
    </NavigationContent>
  );
}

const createSwipeTabNavigator = createNavigatorFactory(SwipeTabNavigator as any);
const { Navigator } = createSwipeTabNavigator();
const SwipeTabs = withLayoutContext<any, typeof Navigator, any, any>(Navigator);

export default function TabLayout() {
  return (
    <SwipeTabs>
      <SwipeTabs.Screen name="index" options={{ title: "Inicio" }} />
      <SwipeTabs.Screen name="transactions" options={{ title: "Movimientos" }} />
      <SwipeTabs.Screen name="analytics" options={{ title: "Análisis" }} />
      <SwipeTabs.Screen name="profile" options={{ title: "Perfil" }} />
      <SwipeTabs.Screen name="add-button" options={{ href: null } as any} />
      <SwipeTabs.Screen name="explore" options={{ href: null } as any} />
    </SwipeTabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    elevation: 24,
    zIndex: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeBubble: {
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

});

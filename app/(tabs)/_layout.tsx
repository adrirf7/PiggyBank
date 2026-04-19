import { createNavigatorFactory, TabRouter, useNavigationBuilder } from "@react-navigation/core";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { withLayoutContext } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";

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
    translateX.value = withSpring(-swipeableIndex * SCREEN_WIDTH, { damping: 28, stiffness: 240, mass: 0.8 });
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
      translateX.value = withSpring(-next * SCREEN_WIDTH, { damping: 28, stiffness: 240, mass: 0.8 });

      if (next !== swipeableIndex) runOnJS(navigateTo)(next);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Tab bar layout
  const tabBarHeight = Platform.OS === "ios" ? 62 : 58;
  const tabBarBottom = Platform.OS === "ios" ? Math.max(insets.bottom, 20) : 16;
  const tabBarTotalHeight = tabBarHeight + (Platform.OS !== "ios" ? insets.bottom : 0);
  const pillBottom = tabBarBottom + 20;

  const handleTabPress = (tabIdx: number) => {
    const route = swipeableRoutes[tabIdx];
    if (!route) return;
    const isFocused = swipeableIndex === tabIdx;
    const event = (navigation as any).emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) (navigation as any).navigate(route.name);
  };

  const renderTab = (item: (typeof TAB_ITEMS)[number], tabIdx: number) => {
    const isFocused = swipeableIndex === tabIdx;
    const color = isFocused ? PRIMARY : "#3A3A3A";
    return (
      <TouchableOpacity key={item.name} style={styles.tabItem} onPress={() => handleTabPress(tabIdx)} activeOpacity={0.7}>
        <Ionicons name={isFocused ? item.iconFocused : item.icon} size={item.size} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <NavigationContent>
      <View style={{ flex: 1, overflow: "hidden" }}>

        {/* ── Fondo estático global (se renderiza una vez, el contenido desliza encima) ── */}
        <View style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={["#03091E", "#010408", "#000000"]}
            locations={[0, 0.48, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Rayos de luz */}
          <View pointerEvents="none" style={styles.raysContainer}>
            <LinearGradient colors={["rgba(93,168,255,0.26)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.ray, { left: "5%",  width: 38, transform: [{ rotate: "-22deg" }] }]} />
            <LinearGradient colors={["rgba(93,168,255,0.12)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.ray, { left: "21%", width: 22, transform: [{ rotate: "-13deg" }] }]} />
            <LinearGradient colors={["rgba(93,168,255,0.21)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.ray, { left: "40%", width: 54, transform: [{ rotate: "-4deg"  }] }]} />
            <LinearGradient colors={["rgba(93,168,255,0.10)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.ray, { left: "62%", width: 28, transform: [{ rotate: "10deg"  }] }]} />
            <LinearGradient colors={["rgba(93,168,255,0.23)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.ray, { left: "76%", width: 44, transform: [{ rotate: "21deg"  }] }]} />
          </View>
        </View>

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
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.92)"]}
          pointerEvents="none"
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, zIndex: 5 }}
        />

        {/* Pill tab bar */}
        <View
          style={[
            styles.pill,
            { bottom: pillBottom, height: tabBarTotalHeight, paddingBottom: Platform.OS === "ios" ? 10 : 6 + insets.bottom },
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
  raysContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ray: {
    position: "absolute",
    top: -60,
    height: "55%",
    borderRadius: 30,
  },
  pill: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(5,5,5,0.97)",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
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
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

});

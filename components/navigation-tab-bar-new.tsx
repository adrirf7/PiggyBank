import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";

interface TabConfig {
  name: string;
  title: string;
  href: string;
  icon?: string;
  iconFilled?: string;
  isAddButton?: boolean;
}

export function NavigationTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = Colors.dark;
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === "ios" ? 52 : 48;
  const tabBarBottom = Platform.OS === "ios" ? Math.max(insets.bottom, 20) : 16;
  const tabBarTotalHeight = tabBarHeight + (Platform.OS !== "ios" ? insets.bottom : 0);

  const tabs: TabConfig[] = [
    {
      name: "home",
      title: "Inicio",
      href: "/(tabs)",
      icon: "home-outline",
      iconFilled: "home",
    },
    {
      name: "transactions",
      title: "Movimientos",
      href: "/(tabs)/transactions",
      icon: "layers-outline",
      iconFilled: "layers",
    },
    {
      name: "add",
      title: "",
      href: "/add-transaction",
      isAddButton: true,
    },
    {
      name: "analytics",
      title: "Análisis",
      href: "/(tabs)/analytics",
      icon: "stats-chart-outline",
      iconFilled: "stats-chart",
    },
    {
      name: "profile",
      title: "Perfil",
      href: "/(tabs)/profile",
      icon: "person-outline",
      iconFilled: "person",
    },
  ];

  const isTabActive = (tabHref: string) => {
    if (tabHref === "/(tabs)") {
      return pathname === "/(tabs)" || pathname.startsWith("/(tabs)/");
    }
    return pathname.startsWith(tabHref);
  };

  return (
    <>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: tabBarBottom + tabBarTotalHeight,
          left: 0,
          right: 0,
          height: 96,
          zIndex: 1,
        }}
      />

      <View
        style={[
          styles.tabBar,
          {
            height: tabBarTotalHeight,
            paddingBottom: Platform.OS === "ios" ? 8 : 4 + insets.bottom,
            bottom: tabBarBottom,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.92)", "#000000"]}
          locations={[0, 0.45, 1]}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: tabBarTotalHeight,
            bottom: -(tabBarBottom + insets.bottom + 8),
            left: -400,
            right: -400,
          }}
        />

        <View style={styles.tabBarContent}>
          {tabs.map((tab) => {
            const isActive = isTabActive(tab.href);

            return (
              <View key={tab.name} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                {tab.isAddButton ? (
                  <Pressable onPress={() => router.push(tab.href)} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={styles.addButton}>
                      <Ionicons name="add" size={26} color="#FFFFFF" />
                    </View>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push(tab.href)} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={isActive ? styles.activeBubble : undefined}>
                      <Ionicons name={isActive && tab.iconFilled ? (tab.iconFilled as any) : (tab.icon as any)} size={20} color="#FFFFFF" />
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(0,0,0,0.82)",
    borderTopColor: "transparent",
    borderTopWidth: 0,
    position: "absolute",
    left: 26,
    right: 26,
    borderRadius: 30,
    borderWidth: 0,
    elevation: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    zIndex: 10,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  activeBubble: {
    backgroundColor: "#181a1a",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});

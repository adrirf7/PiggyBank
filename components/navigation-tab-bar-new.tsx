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

  const tabBarHeight = Platform.OS === "ios" ? 62 : 58;
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
            paddingBottom: Platform.OS === "ios" ? 10 : 6 + insets.bottom,
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
                  <Pressable onPress={() => router.push(tab.href)} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <Ionicons name={isActive && tab.iconFilled ? (tab.iconFilled as any) : (tab.icon as any)} size={21} color={isActive ? PRIMARY : "#3A3A3A"} />
                    {tab.title && (
                      <View style={[styles.label, { color: isActive ? PRIMARY : "#3A3A3A" }]}>
                        <Ionicons name="text" size={0} color={isActive ? PRIMARY : "#3A3A3A"} />
                      </View>
                    )}
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
    backgroundColor: "rgba(5,5,5,0.97)",
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
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});

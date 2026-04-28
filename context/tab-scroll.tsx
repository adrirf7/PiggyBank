import React, { createContext, useContext } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const TabScrollContext = createContext<SharedValue<number> | null>(null);

export function TabScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0);
  return <TabScrollContext.Provider value={scrollY}>{children}</TabScrollContext.Provider>;
}

export function useTabScrollY(): SharedValue<number> {
  const ctx = useContext(TabScrollContext);
  if (!ctx) throw new Error("useTabScrollY must be inside TabScrollProvider");
  return ctx;
}

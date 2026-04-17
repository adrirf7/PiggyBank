import { CategoryIcon } from "@/components/category-icon";
import { CardTheme } from "@/constants/card-themes";
import { getCurrencySymbol } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  theme: CardTheme;
  accountName: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  currencyCode?: string;
  compact?: boolean;
  showBottomChevron?: boolean;
  chevronExpanded?: boolean;
  accountIcon?: string;
  userName?: string;
  userCountry?: string;
}

function AccountIcon({ icon, size, color }: { icon?: string; size: number; color: string }) {
  return <CategoryIcon icon={icon || "piggy-bank"} size={size} color={color} />;
}

export function BankCard({
  theme,
  accountName,
  balance,
  totalIncome,
  totalExpense,
  totalSaved,
  currencyCode,
  compact,
  showBottomChevron,
  chevronExpanded,
  accountIcon,
  userName,
  userCountry,
}: Props) {
  void totalIncome;
  void totalExpense;
  void totalSaved;
  void compact;

  const code = currencyCode ?? "EUR";
  const currencySymbol = getCurrencySymbol(code);
  const detailParts = [userName, userCountry, code].filter(Boolean);
  const detailText = detailParts.join(" · ");

  // ── Cash-register counter: counts from 0 → balance on mount/change ────────
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    const target = balance;
    const duration = 950;
    const startTime = Date.now();
    let rafId: ReturnType<typeof requestAnimationFrame>;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out so it slows down as it approaches the final value
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayBalance(target * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [balance]);

  const amountText = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayBalance);

  // ── Bubble drift: four shared values drive slow organic movement ──────────
  const b1x = useSharedValue(0);
  const b1y = useSharedValue(0);
  const b2x = useSharedValue(0);
  const b2y = useSharedValue(0);

  useEffect(() => {
    // Bubble 1 (top-right) — slow lateral + vertical drift
    b1x.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 6800, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    b1y.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
          withTiming(-16, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 5400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    // Bubble 2 (bottom-left) — different rhythm and direction
    b2x.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 5600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-6, { duration: 6600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    b2y.value = withDelay(
      1600,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
          withTiming(14, { duration: 5600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-8, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 5800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [b1x, b1y, b2x, b2y]);

  const bubble1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: b1x.value }, { translateY: b1y.value }],
  }));

  const bubble2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: b2x.value }, { translateY: b2y.value }],
  }));

  return (
    <LinearGradient colors={theme.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {/* Decorative circles — animated drift */}
      <Animated.View style={[styles.circle1, { backgroundColor: theme.accentColor + "18" }, bubble1Style]} />
      <Animated.View style={[styles.circle2, { backgroundColor: theme.accentColor + "10" }, bubble2Style]} />

      {/* Top row: chip + account name */}
      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: theme.chipColor }]}>
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </View>
        <Text style={[styles.accountName, { color: theme.accentColor }]} numberOfLines={1}>
          {accountName}
        </Text>
      </View>

      {/* Balance — cash-register count-up */}
      <Text style={styles.balanceLabel}>Saldo disponible</Text>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
          {amountText}
        </Text>
        <Text style={styles.balanceSymbol} numberOfLines={1}>
          {" "}
          {currencySymbol}
        </Text>
      </View>
      {detailText.length > 0 && (
        <Text style={styles.detailLine} numberOfLines={1}>
          {detailText}
        </Text>
      )}

      {showBottomChevron && (
        <View style={styles.centerChevron}>
          <Ionicons name={chevronExpanded ? "chevron-down" : "chevron-up"} size={20} color="rgba(255,255,255,0.55)" />
        </View>
      )}

      <View style={[styles.accountIconBadge, { backgroundColor: theme.accentColor + "22" }]}>
        <AccountIcon icon={accountIcon} size={16} color={theme.accentColor} />
      </View>
    </LinearGradient>
  );
}

export function BankCardSkeleton() {
  // Shimmer pulse on the skeleton
  const shimmer = useSharedValue(0.5);
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <LinearGradient colors={["#2B2F36", "#1E2229"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={[styles.circle1, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
      <View style={[styles.circle2, { backgroundColor: "rgba(255,255,255,0.04)" }]} />

      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <Animated.View style={[styles.skeletonName, shimmerStyle]} />
      </View>

      <Animated.View style={[styles.skeletonLabel, shimmerStyle]} />
      <View style={styles.balanceRow}>
        <Animated.View style={[styles.skeletonAmount, shimmerStyle]} />
        <Animated.View style={[styles.skeletonSymbol, shimmerStyle]} />
      </View>
      <Animated.View style={[styles.skeletonDetail, shimmerStyle]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 26,
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
    minHeight: 220,
  },
  circle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -50,
    right: -50,
  },
  circle2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -25,
    left: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    padding: 4,
    gap: 4,
    justifyContent: "center",
  },
  chipLine: {
    height: 2,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    maxWidth: 160,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 46,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  balanceSymbol: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
    paddingBottom: 2,
  },
  detailLine: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 22,
  },
  centerChevron: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountIconBadge: {
    position: "absolute",
    bottom: 12,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonName: {
    width: 112,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  skeletonLabel: {
    width: 96,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  skeletonAmount: {
    width: 170,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  skeletonSymbol: {
    width: 24,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: 4,
    marginLeft: 6,
  },
  skeletonDetail: {
    width: 180,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});

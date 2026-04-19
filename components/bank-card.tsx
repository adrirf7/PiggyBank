import { CategoryIcon } from "@/components/category-icon";
import { Text } from "@/components/text";
import { CardTheme } from "@/constants/card-themes";
import { getCurrencySymbol } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextStyle, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop, Svg } from "react-native-svg";

// ── Slot-machine digit roller ─────────────────────────────────────────────────
const ROLL_H = 46;

function RollingDigit({ char, rightIdx, style }: { char: string; rightIdx: number; style: TextStyle }) {
  const isNum = /[0-9]/.test(char);
  const digitVal = isNum ? parseInt(char, 10) : 0;
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!isNum) return;
    translateY.value = withDelay(
      rightIdx * 40,
      withTiming(digitVal * -ROLL_H, { duration: 540, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitVal]);

  const rollStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!isNum) {
    return (
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)}>
        <Text style={[style, { lineHeight: ROLL_H }]}>{char}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={{ height: ROLL_H, overflow: "hidden" }}>
      <Animated.View style={rollStyle}>
        {Array.from({ length: 10 }, (_, i) => (
          <Text key={i} style={[style, { lineHeight: ROLL_H, height: ROLL_H }]}>{i}</Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// ── EMV chip — pure metallic, tinted by accent color ─────────────────────────
function EMVChip({ chipColor }: { chipColor: string }) {
  const W = 52;
  const H = 40;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        {/* Vertical: white top highlight → transparent → black bottom shadow */}
        <SvgGradient id="cv" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"    stopColor="#ffffff" stopOpacity={0.50} />
          <Stop offset="0.35" stopColor="#ffffff" stopOpacity={0.10} />
          <Stop offset="0.65" stopColor="#000000" stopOpacity={0.05} />
          <Stop offset="1"    stopColor="#000000" stopOpacity={0.36} />
        </SvgGradient>
        {/* Horizontal: dark edges → white centre bulge */}
        <SvgGradient id="ch" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"    stopColor="#000000" stopOpacity={0.16} />
          <Stop offset="0.40" stopColor="#ffffff" stopOpacity={0.06} />
          <Stop offset="0.50" stopColor="#ffffff" stopOpacity={0.18} />
          <Stop offset="0.60" stopColor="#ffffff" stopOpacity={0.06} />
          <Stop offset="1"    stopColor="#000000" stopOpacity={0.16} />
        </SvgGradient>
        {/* Diagonal catch-light from top-left */}
        <SvgGradient id="cd" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0"    stopColor="#ffffff" stopOpacity={0.22} />
          <Stop offset="0.45" stopColor="#ffffff" stopOpacity={0.00} />
          <Stop offset="1"    stopColor="#000000" stopOpacity={0.10} />
        </SvgGradient>
      </Defs>

      {/* Base */}
      <Rect x="0" y="0" width={W} height={H} rx="7" fill={chipColor} />
      {/* Metallic sheens (neutral white/black — no color bleed) */}
      <Rect x="0" y="0" width={W} height={H} rx="7" fill="url(#cv)" />
      <Rect x="0" y="0" width={W} height={H} rx="7" fill="url(#ch)" />
      <Rect x="0" y="0" width={W} height={H} rx="7" fill="url(#cd)" />
    </Svg>
  );
}

// ── NFC / contactless symbol (SVG) ────────────────────────────────────────────
function NFCIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={20} viewBox="0 0 22 20">
      <Circle cx="3.2" cy="10" r="2.2" fill={color} />
      <Path d="M6,5.5 A6.2,6.2 0,0,1 6,14.5"   stroke={color} strokeWidth="1.9"  fill="none" strokeLinecap="round" />
      <Path d="M9.5,2 A10.5,10.5 0,0,1 9.5,18"  stroke={color} strokeWidth="1.65" fill="none" strokeLinecap="round" opacity="0.60" />
      <Path d="M13,0 A14.5,14.5 0,0,1 13,20"    stroke={color} strokeWidth="1.4"  fill="none" strokeLinecap="round" opacity="0.28" />
    </Svg>
  );
}

// ── Account icon helper ───────────────────────────────────────────────────────
function AccountIcon({ icon, size, color }: { icon?: string; size: number; color: string }) {
  return <CategoryIcon icon={icon || "piggy-bank"} size={size} color={color} />;
}

// ── BankCard ──────────────────────────────────────────────────────────────────
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

  const [hidden, setHidden] = useState(false);

  const code = currencyCode ?? "EUR";
  const currencySymbol = getCurrencySymbol(code);
  const detailParts = [userName, userCountry, code].filter(Boolean);
  const detailText = detailParts.join(" · ");

  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
  const chars = formatted.split("");

  // ── Metallic shimmer sweep on mount ───────────────────────────────────────
  const shimmerX = useSharedValue(-180);
  useEffect(() => {
    shimmerX.value = withDelay(320, withTiming(500, { duration: 1200, easing: Easing.out(Easing.quad) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

  // ── Bubble drift ──────────────────────────────────────────────────────────
  const b1x = useSharedValue(0);
  const b1y = useSharedValue(0);
  const b2x = useSharedValue(0);
  const b2y = useSharedValue(0);

  useEffect(() => {
    b1x.value = withRepeat(withSequence(
      withTiming(16,  { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      withTiming(-10, { duration: 6800, easing: Easing.inOut(Easing.sin) }),
      withTiming(8,   { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 5800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    b1y.value = withDelay(600, withRepeat(withSequence(
      withTiming(12,  { duration: 5800, easing: Easing.inOut(Easing.sin) }),
      withTiming(-16, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      withTiming(6,   { duration: 6200, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 5400, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));
    b2x.value = withDelay(1000, withRepeat(withSequence(
      withTiming(-14, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
      withTiming(10,  { duration: 5600, easing: Easing.inOut(Easing.sin) }),
      withTiming(-6,  { duration: 6600, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 6200, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));
    b2y.value = withDelay(1600, withRepeat(withSequence(
      withTiming(-10, { duration: 6200, easing: Easing.inOut(Easing.sin) }),
      withTiming(14,  { duration: 5600, easing: Easing.inOut(Easing.sin) }),
      withTiming(-8,  { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,   { duration: 5800, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));
  }, [b1x, b1y, b2x, b2y]);

  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ translateX: b1x.value }, { translateY: b1y.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ translateX: b2x.value }, { translateY: b2y.value }] }));

  return (
    <LinearGradient
      colors={theme.colors as any}
      locations={[0, 0.42, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* ── Decorative bubbles ── */}
      <Animated.View style={[styles.circle1, { backgroundColor: theme.accentColor + "14" }, bubble1Style]} />
      <Animated.View style={[styles.circle2, { backgroundColor: theme.accentColor + "0B" }, bubble2Style]} />

      {/* ── Metallic overlays ── */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { height: 60 }]}
      />
      <Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* ── Eye toggle (top-right, absolute) ── */}
      <Pressable style={styles.eyeBtn} onPress={() => setHidden((h) => !h)} hitSlop={8}>
        <Ionicons
          name={hidden ? "eye-off" : "eye"}
          size={19}
          color={theme.accentColor}
        />
      </Pressable>

      {/* ── Top row: chip (left) + account label + NFC (right) ── */}
      <View style={styles.topRow}>
        <EMVChip chipColor={theme.chipColor} />
        <View style={styles.topRight}>
          <Text style={[styles.accountName, { color: theme.accentColor }]} numberOfLines={1}>
            {accountName}
          </Text>
          <NFCIcon color={theme.accentColor} />
        </View>
      </View>

      {/* ── Balance ── */}
      <Text style={styles.balanceLabel}>Saldo disponible</Text>
      <View style={styles.balanceRow}>
        {hidden ? (
          <Text style={[styles.balanceAmount, styles.balanceHidden]}>••••••</Text>
        ) : (
          chars.map((char, i) => {
            const rightIdx = chars.length - 1 - i;
            return <RollingDigit key={rightIdx} char={char} rightIdx={rightIdx} style={styles.balanceAmount} />;
          })
        )}
        {!hidden && <Text style={styles.balanceSymbol}> {currencySymbol}</Text>}
      </View>

      {detailText.length > 0 && (
        <Text style={styles.detailLine} numberOfLines={1}>{detailText}</Text>
      )}

      {/* ── Bottom row: card-number dots + account icon ── */}
      <View style={styles.bottomRow}>
        <Text style={styles.cardDots}>•••• •••• ••••</Text>
        <View style={[styles.accountIconBadge, { backgroundColor: theme.accentColor + "1A" }]}>
          <AccountIcon icon={accountIcon} size={16} color={theme.accentColor} />
        </View>
      </View>

      {/* ── Chevron (stacked-cards indicator) ── */}
      {showBottomChevron && (
        <View style={styles.centerChevron}>
          <Ionicons
            name={chevronExpanded ? "chevron-down" : "chevron-up"}
            size={18}
            color="rgba(255,255,255,0.45)"
          />
        </View>
      )}
    </LinearGradient>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function BankCardSkeleton() {
  const shimmer = useSharedValue(0.5);
  useEffect(() => {
    shimmer.value = withRepeat(withSequence(
      withTiming(1,   { duration: 900, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
  }, [shimmer]);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <LinearGradient colors={["#171920", "#1E2229"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={[styles.circle1, { backgroundColor: "rgba(255,255,255,0.04)" }]} />
      <View style={[styles.circle2, { backgroundColor: "rgba(255,255,255,0.03)" }]} />

      <View style={styles.topRow}>
        <View style={styles.skeletonChip} />
        <Animated.View style={[styles.skeletonName, shimmerStyle]} />
      </View>

      <Animated.View style={[styles.skeletonLabel, shimmerStyle]} />
      <View style={styles.balanceRow}>
        <Animated.View style={[styles.skeletonAmount, shimmerStyle]} />
        <Animated.View style={[styles.skeletonSymbol, shimmerStyle]} />
      </View>
      <Animated.View style={[styles.skeletonDetail, shimmerStyle]} />
      <View style={styles.bottomRow}>
        <Animated.View style={[styles.skeletonDots, shimmerStyle]} />
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
    minHeight: 230,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.07)",
  },
  circle1: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -70,
    right: -55,
  },
  circle2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -40,
    left: 5,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 150,
    left: 0,
  },

  // ── Eye button ──
  eyeBtn: {
    position: "absolute",
    top: 18,
    right: 20,
    zIndex: 10,
    padding: 4,
  },

  // ── Top row ──
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingRight: 32,
  },
  topRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  accountName: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    maxWidth: 120,
  },

  // ── Balance ──
  balanceHidden: {
    letterSpacing: 6,
    lineHeight: ROLL_H,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: ROLL_H,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  balanceSymbol: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    paddingBottom: 3,
  },
  detailLine: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginBottom: 14,
  },

  // ── Bottom row ──
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  cardDots: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: "600",
  },
  accountIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Chevron ──
  centerChevron: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },

  // ── Skeleton ──
  skeletonChip: {
    width: 52,
    height: 40,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  skeletonName: {
    width: 100,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  skeletonLabel: {
    width: 88,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 8,
  },
  skeletonAmount: {
    width: 160,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  skeletonSymbol: {
    width: 22,
    height: 18,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 4,
    marginLeft: 6,
  },
  skeletonDetail: {
    width: 160,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 14,
  },
  skeletonDots: {
    width: 110,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});

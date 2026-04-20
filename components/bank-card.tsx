import { Text } from "@/components/text";
import { CardTheme } from "@/constants/card-themes";
import { getCurrencySymbol } from "@/utils/currency";
import { CategoryIcon } from "@/components/category-icon";
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
  withTiming,
} from "react-native-reanimated";
import { Defs, LinearGradient as SvgGradient, Path, Rect, Stop, Svg } from "react-native-svg";

// ── Slot-machine digit roller ─────────────────────────────────────────────────
const ROLL_H = 50;

function RollingDigit({ char, style }: { char: string; style: TextStyle }) {
  const isNum = /[0-9]/.test(char);
  const digitVal = isNum ? parseInt(char, 10) : 0;
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!isNum) return;
    translateY.value = withTiming(digitVal * -ROLL_H, {
      duration: 560,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
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

// ── EMV Chip — silver on all cards ───────────────────────────────────────────
const SILVER = "#B8BDC8";

function EMVChip() {
  const W = 44, H = 34;
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <SvgGradient id="cv" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"    stopColor="#fff" stopOpacity={0.55} />
          <Stop offset="0.4"  stopColor="#fff" stopOpacity={0.10} />
          <Stop offset="0.65" stopColor="#000" stopOpacity={0.04} />
          <Stop offset="1"    stopColor="#000" stopOpacity={0.38} />
        </SvgGradient>
        <SvgGradient id="ch" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"    stopColor="#000" stopOpacity={0.14} />
          <Stop offset="0.45" stopColor="#fff" stopOpacity={0.20} />
          <Stop offset="0.55" stopColor="#fff" stopOpacity={0.20} />
          <Stop offset="1"    stopColor="#000" stopOpacity={0.14} />
        </SvgGradient>
        <SvgGradient id="cd" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0"   stopColor="#fff" stopOpacity={0.25} />
          <Stop offset="0.5" stopColor="#fff" stopOpacity={0.00} />
          <Stop offset="1"   stopColor="#000" stopOpacity={0.10} />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={H} rx="6" fill={SILVER} />
      <Rect x="0" y="0" width={W} height={H} rx="6" fill="url(#cv)" />
      <Rect x="0" y="0" width={W} height={H} rx="6" fill="url(#ch)" />
      <Rect x="0" y="0" width={W} height={H} rx="6" fill="url(#cd)" />
      <Path d={`M${W / 2},0 L${W / 2},${H}`} stroke="#00000018" strokeWidth="0.8" />
      <Path d={`M0,${H / 2} L${W},${H / 2}`} stroke="#00000018" strokeWidth="0.8" />
      <Path d={`M${W / 2},0 L${W / 2},${H}`} stroke="#ffffff10" strokeWidth="0.4" />
    </Svg>
  );
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
  cardFirstFour?: string;
  cardLastFour?: string;
  expiryDate?: string;
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
  cardFirstFour,
  cardLastFour,
  expiryDate,
}: Props) {
  void totalIncome; void totalExpense; void totalSaved; void compact;

  const [hidden, setHidden] = useState(false);

  const code = currencyCode ?? "EUR";
  const currencySymbol = getCurrencySymbol(code);

  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
  const commaIdx  = formatted.lastIndexOf(",");
  const intPart   = commaIdx >= 0 ? formatted.slice(0, commaIdx) : formatted;
  const centsPart = commaIdx >= 0 ? formatted.slice(commaIdx + 1) : "00";
  const intChars  = intPart.split("");

  const nameDisplay     = userName ? userName.toUpperCase() : accountName.toUpperCase();
  const first4          = cardFirstFour ?? "••••";
  const last4           = cardLastFour  ?? "••••";
  const expiry          = expiryDate    ?? "••/••••";
  const cardMaskDisplay = `${first4}  ····  ····  ${last4}`;

  return (
    <LinearGradient
      colors={theme.colors as any}
      locations={theme.locations as any}
      start={{ x: 0.0, y: 0.0 }}
      end={{ x: 1.0, y: 1.0 }}
      style={styles.card}
    >
      {/* ── Right column: account icon + eye, absolutely positioned ── */}
      <View style={styles.rightColumn}>
        <CategoryIcon icon={accountIcon ?? "card"} size={28} color="rgba(255,255,255,0.18)" />
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="rgba(255,255,255,0.65)"
          />
        </Pressable>
      </View>

      {/* ── "Card Balance" label ── */}
      <Text style={styles.balanceLabel}>{accountName}</Text>

      {/* ── Balance ── */}
      {hidden ? (
        <Text style={styles.balanceHidden}>•••••••</Text>
      ) : (
        <View style={styles.balanceRow}>
          <Text style={styles.balanceInt}>{currencySymbol}</Text>
          {intChars.map((char, i) => (
            <RollingDigit
              key={i}
              char={char}
              style={styles.balanceInt}
            />
          ))}
          <Text style={styles.balanceCents}>,{centsPart}</Text>
        </View>
      )}

      {/* ── Spacer ── */}
      <View style={{ flex: 1, minHeight: 18 }} />

      {/* ── EMV Chip (silver) ── */}
      <EMVChip />

      <View style={{ height: 14 }} />

      {/* ── Bottom info grid ── */}
      <View style={styles.bottomGrid}>
        <View style={styles.bottomGridRow}>
          <Text style={styles.cardInfoLabel}>Cardholder Name</Text>
          <Text style={styles.expiryDate}>{expiry}</Text>
        </View>
        <View style={styles.bottomGridRow}>
          <Text style={styles.cardHolder} numberOfLines={1}>{nameDisplay}</Text>
          <Text style={styles.cardMask} numberOfLines={1}>{cardMaskDisplay}</Text>
        </View>
      </View>

      {showBottomChevron && (
        <View style={styles.centerChevron}>
          <Ionicons
            name={chevronExpanded ? "chevron-down" : "chevron-up"}
            size={18}
            color="rgba(255,255,255,0.40)"
          />
        </View>
      )}
    </LinearGradient>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function BankCardSkeleton() {
  const shimmer = useSharedValue(0.4);
  useEffect(() => {
    shimmer.value = withTiming(1, { duration: 900 });
  }, [shimmer]);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <LinearGradient colors={["#060000", "#220800", "#060000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Animated.View style={[{ width: 80, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 10 }, shimmerStyle]} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Animated.View style={[{ width: 160, height: ROLL_H, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.18)" }, shimmerStyle]} />
        <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.12)" }, shimmerStyle]} />
      </View>
      <View style={{ flex: 1, minHeight: 18 }} />
      <View style={{ width: 44, height: 34, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.14)" }} />
      <View style={{ height: 14 }} />
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Animated.View style={[{ width: 100, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.14)" }, shimmerStyle]} />
          <Animated.View style={[{ width: 50, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.10)" }, shimmerStyle]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Animated.View style={[{ width: 130, height: 11, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.18)" }, shimmerStyle]} />
          <Animated.View style={[{ width: 110, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.10)" }, shimmerStyle]} />
        </View>
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    paddingBottom: 20,
    overflow: "hidden",
    width: "100%",
    alignSelf: "stretch",
    minHeight: 210,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },

  // ── Right column: account icon + eye ──
  rightColumn: {
    position: "absolute",
    top: 18,
    right: 18,
    alignItems: "center",
    gap: 10,
  },

  // ── Balance ──
  balanceLabel: {
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.50)",
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  balanceInt: {
    fontFamily: "DMSans_900Black",
    color: "#FFFFFF",
    fontSize: 40,
    letterSpacing: -1.5,
    lineHeight: ROLL_H,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  balanceCents: {
    fontFamily: "DMSans_900Black",
    color: "rgba(255,255,255,0.70)",
    fontSize: 26,
    letterSpacing: -1,
    lineHeight: 30,
    marginBottom: 5,
  },
  balanceHidden: {
    fontFamily: "DMSans_900Black",
    color: "#FFFFFF",
    fontSize: 36,
    letterSpacing: 8,
    lineHeight: ROLL_H,
  },

  // ── Bottom info grid ──
  bottomGrid: {
    gap: 6,
  },
  bottomGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfoLabel: {
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  expiryDate: {
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  cardHolder: {
    fontFamily: "DMSans_700Bold",
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  cardMask: {
    fontFamily: "DMSans_400Regular",
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    letterSpacing: 1.2,
  },

  centerChevron: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: "center",
  },
});

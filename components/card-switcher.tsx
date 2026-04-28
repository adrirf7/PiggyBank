import { PRIMARY } from "@/constants/theme";
import { Account } from "@/types";
import { getCurrencySymbol } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Text } from "@/components/text";

// Exported so the tab navigator can waitFor this gesture before activating its
// own pan — this lets the FlatList win the gesture competition on Android.
export const accountSliderNativeGesture = Gesture.Native();

export interface CardData {
  account: Account;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
}

interface Props {
  cards: CardData[];
  activeAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: () => void;
  currencyCode?: string;
  userName?: string;
  userCountry?: string;
  isLoading?: boolean;
}

const SCREEN_W = Dimensions.get("window").width;
// Each page width = full screen (the FlatList is laid out edge-to-edge inside
// the section container, so we measure via onLayout instead of using margins)
const DOT_SIZE = 6;
const DOT_GAP = 6;

// ── Single account page ───────────────────────────────────────────────────────
interface PageProps {
  card: CardData;
  width: number;
  currencyCode?: string;
  onAccountsPress: () => void;
}

function AccountPage({ card, width, currencyCode, onAccountsPress }: PageProps) {
  const code = currencyCode ?? "EUR";
  const symbol = getCurrencySymbol(code);

  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(card.balance);

  const commaIdx = formatted.lastIndexOf(",");
  const intPart = commaIdx >= 0 ? formatted.slice(0, commaIdx) : formatted;
  const centsPart = commaIdx >= 0 ? formatted.slice(commaIdx + 1) : "00";

  return (
    <View style={[styles.page, { width }]}>
      {/* Account label */}
      <Text style={styles.accountLabel}>
        {card.account.name}
        <Text style={styles.accountLabelDot}> · </Text>
        {code}
      </Text>

      {/* Balance */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceInt}>{intPart}</Text>
        {centsPart !== "00" && (
          <Text style={styles.balanceCents}>.{centsPart}</Text>
        )}
        <Text style={styles.balanceSymbol}>{symbol}</Text>
      </View>

      {/* Accounts button */}
      <Pressable style={styles.accountsBtn} onPress={onAccountsPress}>
        <Text style={styles.accountsBtnText}>Cuentas</Text>
      </Pressable>
    </View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function BankCardSkeleton() {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withSpring(0.7, { damping: 10, stiffness: 60 });
  }, [opacity]);
  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.skeleton}>
      <Animated.View style={[styles.skeletonLabel, shimmer]} />
      <Animated.View style={[styles.skeletonBalance, shimmer]} />
      <Animated.View style={[styles.skeletonBtn, shimmer]} />
    </View>
  );
}

// ── Main CardSwitcher ─────────────────────────────────────────────────────────
export function CardSwitcher({
  cards,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  currencyCode,
  isLoading,
}: Props) {
  const flatRef = useRef<FlatList>(null);
  const [containerW, setContainerW] = useState(SCREEN_W);

  const activeIndex = Math.max(
    0,
    cards.findIndex((c) => c.account.id === activeAccountId),
  );

  // Scroll to active card when it changes externally
  useEffect(() => {
    if (cards.length === 0) return;
    flatRef.current?.scrollToIndex({ index: activeIndex, animated: true });
  }, [activeIndex, cards.length]);

  const handleScrollSettled = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / containerW);
      const card = cards[idx];
      if (card && card.account.id !== activeAccountId) {
        onSelectAccount(card.account.id);
      }
    },
    [cards, containerW, activeAccountId, onSelectAccount],
  );

  if (isLoading) return <BankCardSkeleton />;

  if (cards.length === 0) {
    return (
      <Pressable style={styles.emptyBtn} onPress={onAddAccount}>
        <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
        <Text style={[styles.emptyBtnText, { color: PRIMARY }]}>Gestionar Cuentas</Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.root}>
      {/* Swipeable pages — wrapped in GestureDetector so the tab navigator's
          panGesture can waitFor this native gesture and yield to it. */}
      <GestureDetector gesture={accountSliderNativeGesture}>
        <FlatList
          ref={flatRef}
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.account.id}
          onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
          onScrollEndDrag={handleScrollSettled}
          onMomentumScrollEnd={handleScrollSettled}
          getItemLayout={(_, index) => ({
            length: containerW,
            offset: containerW * index,
            index,
          })}
          renderItem={({ item }) => (
            <AccountPage
              card={item}
              width={containerW}
              currencyCode={currencyCode}
              onAccountsPress={onAddAccount}
            />
          )}
        />
      </GestureDetector>

      {/* Dot indicators */}
      {cards.length > 1 && (
        <View style={styles.dotsRow}>
          {cards.map((c, i) => (
            <View
              key={c.account.id}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },

  // ── Page ──
  page: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  accountLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
    marginBottom: 14,
  },
  accountLabelDot: {
    color: "rgba(255,255,255,0.30)",
  },

  // ── Balance ──
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 28,
  },
  balanceSymbol: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 58,
    marginLeft: 4,
  },
  balanceInt: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "800",
    letterSpacing: -2.5,
    lineHeight: 64,
  },
  balanceCents: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginTop: 4,
  },

  // ── Accounts button ──
  accountsBtn: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  accountsBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DOT_GAP,
    marginTop: 4,
    marginBottom: 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  // ── Empty state ──
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY + "40",
    borderStyle: "dashed",
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Skeleton ──
  skeleton: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  skeletonLabel: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  skeletonBalance: {
    width: 200,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  skeletonBtn: {
    width: 100,
    height: 38,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});

import { getCardTheme } from "@/constants/card-themes";
import { PRIMARY } from "@/constants/theme";
import { Account } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/text";
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { BankCard, BankCardSkeleton } from "./bank-card";

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

// Visible strip of each card when cards are superposed
const STACK_VISIBLE = 56;
const ADD_BTN_H = 52;
// Lower damping = more elastic bounce at the end of the spring animation
const SPRING = { damping: 20, stiffness: 200, mass: 0.95 };
const CARD_H_ESTIMATE = 248;

// ── Stacked card that fans out from behind when expanded ─────────────────────
interface StackedCardProps {
  card: CardData;
  index: number;
  totalOtherCards: number;
  expanded: boolean;
  expandProgress: SharedValue<number>;
  onSelect: () => void;
  currencyCode?: string;
  userName?: string;
  userCountry?: string;
}

function StackedCard({ card, index, totalOtherCards, expanded, expandProgress, onSelect, currencyCode, userName, userCountry }: StackedCardProps) {
  const theme = getCardTheme(card.account.themeId);

  const style = useAnimatedStyle(() => {
    const expandedTop = (totalOtherCards - index - 1) * STACK_VISIBLE;
    // Each subsequent card appears slightly later (stagger by 0.08 per index)
    const stagger = index * 0.08;
    const opacityStart = stagger;
    const opacityEnd = Math.min(0.4 + stagger, 0.75);
    const scaleStart = stagger;
    const scaleEnd = Math.min(0.65 + stagger, 0.92);
    return {
      top: interpolate(expandProgress.value, [0, 1], [0, expandedTop]),
      opacity: interpolate(expandProgress.value, [opacityStart, opacityEnd], [0, 1], Extrapolation.CLAMP),
      transform: [
        // Scale in from 0.88 → 1 with stagger
        { scale: interpolate(expandProgress.value, [scaleStart, scaleEnd], [0.88, 1], Extrapolation.CLAMP) },
        // Rise up from 18px below → 0 with stagger
        { translateY: interpolate(expandProgress.value, [opacityStart, opacityEnd], [18, 0], Extrapolation.CLAMP) },
      ],
      zIndex: 100 - index,
    };
  });

  return (
    <Animated.View pointerEvents={expanded ? "auto" : "none"} style={[{ position: "absolute", left: 0, right: 0 }, style]}>
      <View style={styles.stackCardShadow}>
        <Pressable onPress={onSelect} style={{ borderRadius: 24, overflow: "hidden" }}>
          <BankCard
            theme={theme}
            accountName={card.account.name}
            balance={card.balance}
            totalIncome={card.totalIncome}
            totalExpense={card.totalExpense}
            totalSaved={card.totalSaved}
            currencyCode={currencyCode}
            accountIcon={card.account.icon}
            userName={userName}
            userCountry={userCountry}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0.38)", "rgba(0,0,0,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.stackShadowStrip}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Add account button ───────────────────────────────────────────────────────
interface AddBtnProps {
  expanded: boolean;
  expandProgress: SharedValue<number>;
  cardHeightSv: SharedValue<number>;
  totalOtherCards: number;
  onPress: () => void;
}

function AddAccountButton({ expanded, expandProgress, cardHeightSv, totalOtherCards, onPress }: AddBtnProps) {
  const style = useAnimatedStyle(() => {
    const h = cardHeightSv.value || CARD_H_ESTIMATE;
    const cardsBlockHeight = totalOtherCards * STACK_VISIBLE;
    return {
      top: h + cardsBlockHeight + 10,
      opacity: interpolate(expandProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View pointerEvents={expanded ? "auto" : "none"} style={[{ position: "absolute", left: 0, right: 0 }, style]}>
      <Pressable style={styles.addBtn} onPress={onPress}>
        <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
        <Text style={[styles.addBtnText, { color: PRIMARY }]}>Gestionar Cuentas</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Main CardSwitcher ────────────────────────────────────────────────────────
export function CardSwitcher({ cards, activeAccountId, onSelectAccount, onAddAccount, currencyCode, userName, userCountry, isLoading }: Props) {
  const [expanded, setExpanded] = useState(false);
  const expandProgress = useSharedValue(0);
  const cardHeightSv = useSharedValue(CARD_H_ESTIMATE);

  const activeCard = cards.find((c) => c.account.id === activeAccountId) ?? cards[0];
  const otherCards = cards.filter((c) => c.account.id !== activeCard?.account.id);

  useEffect(() => {
    expandProgress.value = withSpring(expanded ? 1 : 0, SPRING);
  }, [expanded, expandProgress]);

  // Collapse when active account changes externally.
  // expanded intentionally omitted — including it would cause an infinite loop.
  useEffect(() => {
    if (expanded) setExpanded(false);
  }, [activeAccountId]);

  const handleSelect = (id: string) => {
    onSelectAccount(id);
    setExpanded(false);
  };

  const activeCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(expandProgress.value, [0, 1], [0, otherCards.length * STACK_VISIBLE]) },
      // Quick dip then recover — tactile "push" feel when tapping
      { scale: interpolate(expandProgress.value, [0, 0.12, 0.5, 1], [1, 0.972, 0.985, 1]) },
    ],
  }));

  // Height: collapsed = card height only, expanded = card + stacked cards + button
  const containerStyle = useAnimatedStyle(() => {
    const h = cardHeightSv.value;
    const n = otherCards.length;
    const collapsedH = h;
    const expandedCardsHeight = n * STACK_VISIBLE;
    const expandedH = h + expandedCardsHeight + ADD_BTN_H + 14;
    return {
      height: interpolate(expandProgress.value, [0, 1], [collapsedH, expandedH]),
    };
  });

  if (isLoading) {
    return <BankCardSkeleton />;
  }

  if (!activeCard) {
    return (
      <View>
        <Pressable style={styles.addBtn} onPress={onAddAccount}>
          <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
          <Text style={[styles.addBtnText, { color: PRIMARY }]}>Gestionar Cuentas</Text>
        </Pressable>
      </View>
    );
  }

  const activeTheme = getCardTheme(activeCard.account.themeId);

  return (
    <Animated.View style={containerStyle}>
      {/* Active card */}
      <Animated.View style={[{ zIndex: 1000, position: "relative" }, activeCardStyle]}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          onLayout={(e) => { cardHeightSv.value = e.nativeEvent.layout.height; }}
          style={{ borderRadius: 24, overflow: "hidden" }}
        >
          <BankCard
            theme={activeTheme}
            accountName={activeCard.account.name}
            balance={activeCard.balance}
            totalIncome={activeCard.totalIncome}
            totalExpense={activeCard.totalExpense}
            totalSaved={activeCard.totalSaved}
            currencyCode={currencyCode}
            showBottomChevron
            chevronExpanded={expanded}
            accountIcon={activeCard.account.icon}
            userName={userName}
            userCountry={userCountry}
          />
        </Pressable>
      </Animated.View>

      {/* Stacked other-account cards */}
      {expanded &&
        otherCards.map((card, idx) => (
          <StackedCard
            key={card.account.id}
            card={card}
            index={idx}
            totalOtherCards={otherCards.length}
            expanded={expanded}
            expandProgress={expandProgress}
            onSelect={() => handleSelect(card.account.id)}
            currencyCode={currencyCode}
            userName={userName}
            userCountry={userCountry}
          />
        ))}

      {/* Add account button (visible only when expanded) */}
      {expanded && (
        <AddAccountButton expanded={expanded} expandProgress={expandProgress} cardHeightSv={cardHeightSv} totalOtherCards={otherCards.length} onPress={onAddAccount} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY + "40",
    borderStyle: "dashed",
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stackCardShadow: {
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  stackShadowStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 34,
  },
});

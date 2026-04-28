import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { getBackgroundImage } from "@/constants/background-images";
import { Text } from "@/components/text";
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  interpolateColor,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CardSwitcher, accountSliderNativeGesture } from "@/components/card-switcher";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import TransactionItem from "@/components/transaction-item";
import { Colors, PRIMARY } from "@/constants/theme";
import { useAccount } from "@/context/account";
import { useTabScrollY } from "@/context/tab-scroll";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useCategoriesStore } from "@/store/use-categories";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { Transaction } from "@/types";
import { compareTransactionsNewestFirst, formatCurrency } from "@/utils/calculations";

export default function DashboardScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { alert } = useAlert();
  const { transactions, deleteTransactions } = useTransactionStore();
  const { allCategories } = useCategoriesStore();
  const { goals } = useSavingsGoalStore();
  const { accounts, activeAccount, activeAccountId, switchAccount, loading: accountsLoading } = useAccount();
  const tabScrollY = useTabScrollY();
  const insets = useSafeAreaInsets();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ top: 300, right: 20 });
  const moreButtonRef = useRef<View>(null);
  const scrollRef = useRef<React.ElementRef<typeof Animated.ScrollView>>(null);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const activeAccountTransactions = useMemo(() => {
    if (!activeAccount) return transactions;
    const isDefault = activeAccount.isDefault ?? accounts[0]?.id === activeAccount.id;
    return transactions.filter((tx: Transaction) =>
      isDefault ? !tx.accountId || tx.accountId === activeAccount.id : tx.accountId === activeAccount.id,
    );
  }, [transactions, activeAccount, accounts]);

  const cardData = useMemo(() => {
    return accounts.map((account, idx) => {
      const isDefault = account.isDefault ?? idx === 0;
      const accountTxs = transactions.filter((tx: Transaction) =>
        isDefault ? !tx.accountId || tx.accountId === account.id : tx.accountId === account.id,
      );
      const inc = { normal: 0, goal: 0 };
      const exp = { normal: 0, goal: 0 };
      for (const tx of accountTxs) {
        const target = tx.type === "income" ? inc : exp;
        if (tx.isGoalContribution) target.goal += tx.amount;
        else target.normal += tx.amount;
      }
      return {
        account,
        balance: inc.normal - exp.normal - inc.goal + exp.goal,
        totalIncome: inc.normal,
        totalExpense: exp.normal,
        totalSaved: inc.goal - exp.goal,
      };
    });
  }, [accounts, transactions]);

  const { topGoal, topGoalPercent } = useMemo(() => {
    const g = goals[0] ?? null;
    const pct = g && g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
    return { topGoal: g, topGoalPercent: pct };
  }, [goals]);

  const recentTxs = useMemo(
    () => [...activeAccountTransactions].sort(compareTransactionsNewestFirst).slice(0, 5),
    [activeAccountTransactions],
  );
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const categoriesById = useMemo(() => new Map(allCategories.map((c) => [c.id, c])), [allCategories]);

  const todaySpending = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("sv-SE"); // "YYYY-MM-DD" in local time
    const todayExpenses = transactions.filter(
      (tx) => tx.type === "expense" && !tx.isGoalContribution && tx.date === todayStr,
    );
    const total = todayExpenses.reduce((sum, tx) => sum + (typeof tx.amount === "number" ? tx.amount : 0), 0);
    const byCategory = new Map<string, { name: string; color: string; amount: number }>();
    for (const tx of todayExpenses) {
      const cat = categoriesById.get(tx.category);
      const existing = byCategory.get(tx.category);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        byCategory.set(tx.category, {
          name: cat?.name ?? "Sin categoría",
          color: cat?.color ?? "#64748B",
          amount: tx.amount,
        });
      }
    }
    const segments = Array.from(byCategory.entries())
      .map(([id, data]) => ({ id, ...data, pct: total > 0 ? (data.amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
    return { total, segments };
  }, [transactions, categoriesById]);

  const selectedTransactions = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const set = new Set(selectedIds);
    return recentTxs.filter((tx) => set.has(tx.id));
  }, [recentTxs, selectedIds]);

  useEffect(() => {
    if (!selectionMode) return;
    const visibleIds = new Set(recentTxs.map((tx) => tx.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [recentTxs, selectionMode]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!selectionMode) return false;
        clearSelection();
        return true;
      });
      return () => sub.remove();
    }, [selectionMode, clearSelection]),
  );

  useFocusEffect(
    useCallback(() => {
      tabScrollY.value = 0;
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    }, [tabScrollY]),
  );

  useFocusEffect(useCallback(() => () => clearSelection(), [clearSelection]));

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const bgImageSource = useMemo(
    () => getBackgroundImage(userProfile?.backgroundImageId).source ?? null,
    [userProfile?.backgroundImageId],
  );

  const firstName = user?.displayName?.split(" ")[0] ?? null;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length === 0) setSelectionMode(false);
      return next;
    });
  };

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.length === 0) return;
    const label =
      selectedTransactions.length === 1 ? "1 transacción" : `${selectedTransactions.length} transacciones`;
    alert("Eliminar transacciones", `¿Seguro que quieres eliminar ${label}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTransactions(selectedTransactions);
          clearSelection();
        },
      },
    ]);
  };

  const openTransactionInMovements = (transactionId: string) => {
    router.push({
      pathname: "/(tabs)/transactions",
      params: { filter: "all", focusTransactionId: transactionId, focusNonce: Date.now().toString() },
    });
  };

  const openMoreMenu = () => {
    moreButtonRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      menuOpacity.value = 0;
      menuTranslateY.value = -6;
      setMenuAnchor({ top: pageY + h + 6, right: 20 });
      setShowMoreMenu(true);
    });
  };

  const handleShare = async () => {
    setShowMoreMenu(false);
    const card = cardData.find((c) => c.account.id === activeAccountId) ?? cardData[0];
    const balanceStr = card ? formatCurrency(card.balance, userProfile?.currencyCode) : "—";
    try {
      await Share.share({
        message: `Mi cuenta "${card?.account.name ?? "Mi cuenta"}" en PiggyBank\nSaldo: ${balanceStr}`,
      });
    } catch { /* ignore */ }
  };

  // ── Scroll → shared parallax value ───────────────────────────────────────────
  const scrollHandler = useAnimatedScrollHandler((event) => {
    tabScrollY.value = event.contentOffset.y;
  });

  // ── Goal bar fill animation ───────────────────────────────────────────────────
  const goalBarSv = useSharedValue(0);
  useEffect(() => {
    goalBarSv.value = withDelay(500, withTiming(topGoalPercent, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [topGoalPercent, goalBarSv]);
  const goalBarStyle = useAnimatedStyle(() => ({ width: `${goalBarSv.value}%` }));

  // ── Avatar wiggle on mount ────────────────────────────────────────────────────
  const avatarWiggle = useSharedValue(0);
  useEffect(() => {
    avatarWiggle.value = withDelay(
      600,
      withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-5, { duration: 70 }),
        withTiming(5, { duration: 70 }),
        withTiming(0, { duration: 60 }),
      ),
    );
  }, [avatarWiggle]);
  const avatarWiggleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${avatarWiggle.value}deg` }] }));

  // ── More menu animation ───────────────────────────────────────────────────────
  const menuOpacity = useSharedValue(0);
  const menuTranslateY = useSharedValue(-6);

  useEffect(() => {
    if (showMoreMenu) {
      menuOpacity.value = withTiming(1, { duration: 150 });
      menuTranslateY.value = withTiming(0, { duration: 150 });
    }
  }, [showMoreMenu, menuOpacity, menuTranslateY]);

  const menuAnimStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ translateY: menuTranslateY.value }],
  }));

  const hasBgImage = bgImageSource != null;
  const bgScrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -tabScrollY.value }],
  }));
  const headerBgStyle = useAnimatedStyle(() => {
    if (!hasBgImage) return {};
    return {
      backgroundColor: interpolateColor(tabScrollY.value, [0, 420], ["transparent", "#090909"]),
    };
  });

  const closeMoreMenu = () => {
    menuOpacity.value = withTiming(0, { duration: 120 }, () => runOnJS(setShowMoreMenu)(false));
    menuTranslateY.value = withTiming(-6, { duration: 120 });
  };

  const sectionTitleEnter = FadeInLeft.duration(400).delay(300).springify();

  // Absorb horizontal swipes in the account section so the outer tab-pager pan
  // never activates there. Inner GestureDetector gestures take priority over the
  // outer navigator pan in RNGH, so once this activates the tab swipe fails.
  // simultaneousWithExternalGesture keeps the FlatList scroll unaffected.
  const accountAreaGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .simultaneousWithExternalGesture(accountSliderNativeGesture)
        .onUpdate(() => {})
        .onEnd(() => {}),
    [],
  );

  return (
    <View style={styles.root}>
      {/* ── Background image — translates 1:1 with scroll so it feels native ── */}
      {bgImageSource && (
        <Animated.View style={[StyleSheet.absoluteFillObject, bgScrollStyle]} pointerEvents="none">
          <Image source={bgImageSource} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0)", "rgba(0,0,0,0.90)", "#090909", "#090909"]}
            locations={[0, 0.18, 0.52, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      )}
      {/* ── Header fade overlay — covers status bar + header, fades transparent→black ── */}
      {hasBgImage && (
        <Animated.View
          style={[{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top + 46 }, headerBgStyle]}
          pointerEvents="none"
        />
      )}
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* ── Header (fixed, outside scroll) ── */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
          <Animated.View entering={FadeInLeft.duration(400).delay(100).springify()}>
            <Text style={styles.headerGreeting}>
              {greeting}{firstName ? `, ${firstName}` : ""}
            </Text>
          </Animated.View>
          <Animated.View style={avatarWiggleStyle}>
            <Pressable style={styles.avatarBtn} onPress={() => router.push("/(tabs)/profile")}>
              <Ionicons name="person" size={18} color={PRIMARY} />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {/* ── Card Switcher ── */}
          <GestureDetector gesture={accountAreaGesture}>
            <Animated.View entering={FadeInDown.duration(600).delay(80).springify()} style={styles.sectionFull}>
              <CardSwitcher
                cards={cardData}
                activeAccountId={activeAccountId}
                onSelectAccount={switchAccount}
                onAddAccount={() => router.push("/manage-accounts")}
                currencyCode={userProfile?.currencyCode}
                userName={firstName || user?.displayName || undefined}
                userCountry={userProfile?.country}
                isLoading={authLoading || accountsLoading}
              />
            </Animated.View>
          </GestureDetector>

          {/* ── 4 Quick Action Buttons ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(160).springify()} style={styles.section}>
            <View style={styles.quickBtnsRow}>
              <Pressable style={styles.quickBtn} onPress={() => router.push({ pathname: "/add-transaction", params: { type: "income" } })}>
                <View style={styles.quickBtnCard}>
                  <Ionicons name="arrow-down-outline" size={20} color="#fff" />
                  <Text style={styles.quickBtnLabel}>Ingreso</Text>
                </View>
              </Pressable>
              <Pressable style={styles.quickBtn} onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}>
                <View style={styles.quickBtnCard}>
                  <Ionicons name="arrow-up-outline" size={20} color="#fff" />
                  <Text style={styles.quickBtnLabel}>Gasto</Text>
                </View>
              </Pressable>
              <Pressable style={styles.quickBtn} onPress={() => router.push("/savings-goals")}>
                <View style={styles.quickBtnCard}>
                  <Ionicons name="trophy-outline" size={20} color="#fff" />
                  <Text style={styles.quickBtnLabel}>Objetivos</Text>
                </View>
              </Pressable>
              <View ref={moreButtonRef} style={styles.quickBtn} collapsable={false}>
                <Pressable style={{ flex: 1 }} onPress={openMoreMenu}>
                  <View style={styles.quickBtnCard}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                    <Text style={styles.quickBtnLabel}>Más</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* ── Daily spending card ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(200).springify()} style={styles.section}>
            <View style={styles.spendingCard}>
              <Text style={styles.spendingTitle}>Gasto del día</Text>
              <Text style={styles.spendingAmount}>
                {formatCurrency(todaySpending.total, userProfile?.currencyCode)}
              </Text>

              {/* Segmented bar */}
              <View style={styles.spendingBarWrap}>
                {todaySpending.segments.length > 0 ? (
                  todaySpending.segments.map((seg) => (
                    <Pressable
                      key={seg.id}
                      style={[
                        styles.spendingSegment,
                        {
                          flex: seg.amount,
                          backgroundColor: seg.color,
                          opacity: activeSegment !== null && activeSegment !== seg.id ? 0.3 : 1,
                        },
                      ]}
                      onPress={() => setActiveSegment((prev) => (prev === seg.id ? null : seg.id))}
                    />
                  ))
                ) : (
                  <View style={styles.spendingSegmentEmpty} />
                )}
              </View>

              {/* Tooltip for tapped segment */}
              {activeSegment !== null && (() => {
                const seg = todaySpending.segments.find((s) => s.id === activeSegment);
                if (!seg) return null;
                return (
                  <View style={styles.segTooltip}>
                    <View style={[styles.segTooltipDot, { backgroundColor: seg.color }]} />
                    <Text style={styles.segTooltipName} numberOfLines={1}>{seg.name}</Text>
                    <Text style={styles.segTooltipAmount}>{formatCurrency(seg.amount, userProfile?.currencyCode)}</Text>
                    <Text style={[styles.segTooltipPct, { color: seg.color }]}>{seg.pct.toFixed(0)}%</Text>
                  </View>
                );
              })()}

              {/* Legend — all categories */}
              {todaySpending.segments.length > 0 ? (
                <View style={styles.spendingLegend}>
                  {todaySpending.segments.map((seg) => (
                    <Pressable
                      key={seg.id}
                      style={[
                        styles.spendingLegendItem,
                        activeSegment !== null && activeSegment !== seg.id && { opacity: 0.35 },
                      ]}
                      onPress={() => setActiveSegment((prev) => (prev === seg.id ? null : seg.id))}
                    >
                      <View style={[styles.spendingLegendDot, { backgroundColor: seg.color }]} />
                      <Text style={styles.spendingLegendText} numberOfLines={1}>{seg.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.spendingEmpty}>Sin gastos registrados hoy</Text>
              )}
            </View>

            {/* ── Goal progress card ── */}
            {topGoal && (
              <Pressable style={styles.goalCard} onPress={() => router.push("/savings-goals")}>
                <View style={[styles.goalIconBubble, { backgroundColor: PRIMARY + "1C" }]}>
                  <Ionicons name="trophy-outline" size={20} color={PRIMARY} />
                </View>
                <View style={styles.goalContent}>
                  <Text style={styles.goalName} numberOfLines={1}>{topGoal.name}</Text>
                  <Text style={styles.goalAmounts}>
                    {formatCurrency(topGoal.currentAmount, userProfile?.currencyCode)}
                    {" / "}
                    {formatCurrency(topGoal.targetAmount, userProfile?.currencyCode)}
                  </Text>
                  <View style={styles.goalBarTrack}>
                    <Animated.View style={[styles.goalBarFill, goalBarStyle]} />
                  </View>
                </View>
                <View style={styles.goalRight}>
                  <Text style={[styles.goalPercent, { color: PRIMARY }]}>{Math.round(topGoalPercent)}%</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.muted} />
                </View>
              </Pressable>
            )}
            {!topGoal && (
              <Pressable style={[styles.goalCard, styles.goalCardEmpty]} onPress={() => router.push("/savings-goals")}>
                <Ionicons name="trophy-outline" size={18} color={PRIMARY} style={{ marginRight: 12 }} />
                <Text style={styles.goalEmptyText}>Crea tu primer objetivo de ahorro</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.muted} />
              </Pressable>
            )}
          </Animated.View>

          {/* ── Recent Transactions ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(240).springify()}
            style={[styles.section, { marginTop: 8 }]}
          >
            <Animated.View entering={sectionTitleEnter} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {selectionMode && (
                  <Pressable onPress={clearSelection}>
                    <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "500" }}>Cancelar</Text>
                  </Pressable>
                )}
                {transactions.length > 5 && (
                  <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                    <Text style={{ color: PRIMARY, fontSize: 13, fontWeight: "600" }}>Ver todo</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {recentTxs.length > 0 && (
              <Text style={styles.selectionHint}>
                {selectionMode
                  ? `${selectedIds.length} seleccionada${selectedIds.length === 1 ? "" : "s"} · Mantén pulsado para seleccionar`
                  : "Mantén pulsado para seleccionar y borrar varias"}
              </Text>
            )}

            {recentTxs.length === 0 ? (
              <Animated.View
                entering={FadeInDown.duration(400).delay(350).springify()}
                style={styles.emptyState}
              >
                <View style={[styles.emptyIcon, { backgroundColor: PRIMARY + "15" }]}>
                  <Ionicons name="wallet-outline" size={30} color={PRIMARY} />
                </View>
                <Text style={styles.emptyText}>
                  Aún no hay transacciones.{"\n"}Usa los botones de arriba para añadir.
                </Text>
              </Animated.View>
            ) : (
              <>
                {recentTxs.map((tx, i) => (
                  <Animated.View
                    key={tx.id}
                    entering={FadeInDown.duration(350).delay(Math.min(i * 55, 350)).springify()}
                  >
                    <TransactionItem
                      transaction={tx}
                      goalById={goalById}
                      categoriesById={categoriesById}
                      selectable={selectionMode}
                      selected={selectedIds.includes(tx.id)}
                      onPress={selectionMode ? toggleSelected : openTransactionInMovements}
                      onLongPress={enterSelectionMode}
                    />
                  </Animated.View>
                ))}
                {!selectionMode && (
                  <Pressable
                    style={styles.seeMoreBtn}
                    onPress={() => router.push("/(tabs)/transactions")}
                  >
                    <Text style={styles.seeMoreText}>Ver más</Text>
                    <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                  </Pressable>
                )}
                {selectionMode && <View style={{ height: 90 }} />}
              </>
            )}
          </Animated.View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* ── More menu ── */}
      {showMoreMenu && (
        <Pressable style={styles.moreBackdrop} onPress={closeMoreMenu} />
      )}
      {showMoreMenu && (
        <Animated.View style={[styles.moreCard, { top: menuAnchor.top, right: menuAnchor.right }, menuAnimStyle]}>
          <Pressable style={styles.moreItem} onPress={handleShare}>
            <Ionicons name="share-outline" size={17} color="#FFFFFF" />
            <Text style={styles.moreItemText}>Compartir cuenta</Text>
          </Pressable>
          <View style={styles.moreDivider} />
          <Pressable
            style={styles.moreItem}
            onPress={() => { closeMoreMenu(); setTimeout(() => router.push("/manage-categories"), 140); }}
          >
            <Ionicons name="pricetags-outline" size={17} color="#FFFFFF" />
            <Text style={styles.moreItemText}>Personalizar categorías</Text>
          </Pressable>
          <View style={styles.moreDivider} />
          <Pressable
            style={styles.moreItem}
            onPress={() => { closeMoreMenu(); setTimeout(() => router.push("/customize-profile"), 140); }}
          >
            <Ionicons name="color-palette-outline" size={17} color="#FFFFFF" />
            <Text style={styles.moreItemText}>Personalizar perfil</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Bulk delete FAB ── */}
      {selectionMode && (
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.fabWrapper}>
          <Pressable
            style={[styles.fab, { backgroundColor: selectedIds.length > 0 ? "#EF4444" : colors.border }]}
            disabled={selectedIds.length === 0}
            onPress={handleDeleteSelected}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
              Eliminar seleccionadas ({selectedIds.length})
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerGreeting: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY + "20",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PRIMARY + "30",
  },

  section: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  sectionFull: {
    marginTop: 28,
    marginBottom: 12,
  },

  // ── 4 Quick buttons ──
  quickBtnsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
  },
  quickBtnCard: {
    backgroundColor: "#181a1a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  quickBtnLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "500",
  },

  // ── Daily spending card ──
  spendingCard: {
    backgroundColor: "#181a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  spendingTitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  spendingAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  spendingBarWrap: {
    flexDirection: "row",
    height: 10,
    gap: 3,
    marginBottom: 10,
  },
  spendingSegment: {
    height: 10,
    borderRadius: 5,
    minWidth: 8,
  },
  spendingSegmentEmpty: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2a2a2a",
  },
  segTooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#242424",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  segTooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  segTooltipName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  segTooltipAmount: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
  },
  segTooltipPct: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 2,
  },
  spendingLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  spendingLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  spendingLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  spendingLegendText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "500",
  },
  spendingEmpty: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    marginTop: 4,
  },

  // ── Goal card ──
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181a1a",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  goalCardEmpty: {
    paddingVertical: 14,
  },
  goalIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  goalContent: {
    flex: 1,
    gap: 2,
  },
  goalName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  goalAmounts: {
    color: "#606070",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  goalBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: "#222222",
  },
  goalBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  goalRight: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 12,
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  goalEmptyText: {
    flex: 1,
    color: "#606070",
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  selectionHint: {
    color: "#606070",
    fontSize: 11,
    marginBottom: 10,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "#606070",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Ver más ──
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 5,
  },
  seeMoreText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Bulk delete FAB ──
  fabWrapper: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
  },
  fab: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  // ── More menu ──
  moreBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  moreCard: {
    position: "absolute",
    zIndex: 51,
    backgroundColor: "#222222",
    borderRadius: 14,
    overflow: "hidden",
    minWidth: 210,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  moreItemText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  moreDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 12,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInLeft,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardSwitcher } from "@/components/card-switcher";
import TransactionItem from "@/components/transaction-item";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAccount } from "@/context/account";
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const activeAccountTransactions = useMemo(() => {
    if (!activeAccount) return transactions;
    const isDefault = activeAccount.isDefault ?? accounts[0]?.id === activeAccount.id;
    return transactions.filter((tx: Transaction) => (isDefault ? !tx.accountId || tx.accountId === activeAccount.id : tx.accountId === activeAccount.id));
  }, [transactions, activeAccount, accounts]);

  const cardData = useMemo(() => {
    return accounts.map((account, idx) => {
      const isDefault = account.isDefault ?? idx === 0;
      const accountTxs = transactions.filter((tx: Transaction) => (isDefault ? !tx.accountId || tx.accountId === account.id : tx.accountId === account.id));
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

  const { totalGoalTarget, totalGoalCurrent, goalPercent } = useMemo(() => {
    let target = 0;
    let current = 0;
    for (const goal of goals) {
      target += goal.targetAmount;
      current += goal.currentAmount;
    }
    return {
      totalGoalTarget: target,
      totalGoalCurrent: current,
      goalPercent: target > 0 ? Math.min((current / target) * 100, 100) : 0,
    };
  }, [goals]);

  const recentTxs = useMemo(() => [...activeAccountTransactions].sort(compareTransactionsNewestFirst).slice(0, 7), [activeAccountTransactions]);
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  const categoriesById = useMemo(() => new Map(allCategories.map((c) => [c.id, c])), [allCategories]);
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
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    }, []),
  );

  useFocusEffect(
    useCallback(() => () => clearSelection(), [clearSelection]),
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const firstName = user?.displayName?.split(" ")[0] ?? null;
  const today = format(new Date(), "EEEE, d MMMM", { locale: es });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

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
    const label = selectedTransactions.length === 1 ? "1 transacción" : `${selectedTransactions.length} transacciones`;
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

  // ── Icon pulse: all three action icons breathe slowly in sync ─────────────
  const iconPulse = useSharedValue(1);
  useEffect(() => {
    iconPulse.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [iconPulse]);

  const iconPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulse.value }],
  }));

  // ── Goal bar: fills from 0% to actual percent with a spring feel ──────────
  const goalBarSv = useSharedValue(0);
  useEffect(() => {
    goalBarSv.value = withDelay(
      500,
      withTiming(goalPercent, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
  }, [goalPercent, goalBarSv]);

  const goalBarStyle = useAnimatedStyle(() => ({
    width: `${goalBarSv.value}%`,
  }));

  // ── Header avatar: tiny wiggle on mount ───────────────────────────────────
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

  const avatarWiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${avatarWiggle.value}deg` }],
  }));

  // ── "Recientes" title: subtle slide-in from left ──────────────────────────
  const sectionTitleEnter = FadeInLeft.duration(400).delay(300).springify();

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <LinearGradient
        colors={["#06101F", "#030810", "#000000"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "transparent" }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
            <Animated.View entering={FadeInLeft.duration(400).delay(100).springify()}>
              <Text style={styles.headerDate}>{todayCapitalized}</Text>
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

          {/* ── Card Switcher ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(80).springify()}
            style={styles.section}
          >
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

          {/* ── Quick Actions ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(160).springify()}
            style={[styles.section, { gap: 10 }]}
          >
            {/* Income + Expense */}
            <View style={[styles.actionCard, { flexDirection: "row", padding: 0, overflow: "hidden" }]}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => router.push({ pathname: "/add-transaction", params: { type: "income" } })}
              >
                <Animated.View style={[styles.actionIcon, { backgroundColor: INCOME_COLOR + "18" }, iconPulseStyle]}>
                  <Ionicons name="arrow-down" size={20} color={INCOME_COLOR} />
                </Animated.View>
                <Text style={styles.actionLabel}>Añadir</Text>
                <Text style={[styles.actionSub, { color: INCOME_COLOR }]}>Ingreso</Text>
              </Pressable>

              <View style={styles.actionDivider} />

              <Pressable
                style={styles.actionBtn}
                onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}
              >
                <Animated.View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: EXPENSE_COLOR + "18" },
                    iconPulseStyle,
                    // Offset phase so the expense icon pulses slightly after income
                    { animationDelay: 300 } as any,
                  ]}
                >
                  <Ionicons name="arrow-up" size={20} color={EXPENSE_COLOR} />
                </Animated.View>
                <Text style={styles.actionLabel}>Añadir</Text>
                <Text style={[styles.actionSub, { color: EXPENSE_COLOR }]}>Gasto</Text>
              </Pressable>
            </View>

            {/* Savings Goals */}
            <Pressable
              style={[styles.actionCard, { flexDirection: "row", alignItems: "center" }]}
              onPress={() => router.push("/savings-goals")}
            >
              <Animated.View style={[styles.actionIcon, { backgroundColor: PRIMARY + "18", marginRight: 14 }, iconPulseStyle]}>
                <Ionicons name="trophy-outline" size={20} color={PRIMARY} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Objetivos de ahorro</Text>
                {goals.length === 0 ? (
                  <Text style={[styles.actionSub, { color: colors.muted, marginTop: 3 }]}>Crea tu primer objetivo</Text>
                ) : (
                  <>
                    <Text style={[styles.actionSub, { color: colors.muted, marginTop: 3 }]}>
                      {goals.length} objetivo{goals.length !== 1 ? "s" : ""} · {formatCurrency(totalGoalCurrent, userProfile?.currencyCode)} de{" "}
                      {formatCurrency(totalGoalTarget, userProfile?.currencyCode)}
                    </Text>
                    {/* Animated progress bar */}
                    <View style={styles.goalBarTrack}>
                      <Animated.View style={[styles.goalBarFill, goalBarStyle]} />
                    </View>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 8 }} />
            </Pressable>
          </Animated.View>

          {/* ── Recent Transactions ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(240).springify()}
            style={[styles.section, { marginTop: 20 }]}
          >
            <Animated.View entering={sectionTitleEnter} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {selectionMode && (
                  <Pressable onPress={clearSelection}>
                    <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "500" }}>Cancelar</Text>
                  </Pressable>
                )}
                {transactions.length > 7 && (
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
              <Animated.View entering={FadeInDown.duration(400).delay(350).springify()} style={styles.emptyState}>
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
                  // Stagger each transaction item: 50ms per item, max 350ms
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
                {selectionMode && <View style={{ height: 90 }} />}
              </>
            )}
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      {/* ── Bulk delete FAB ── */}
      {selectionMode && (
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          style={styles.fabWrapper}
        >
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  headerDate: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  headerGreeting: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 3,
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
  actionCard: {
    backgroundColor: "#0E0E0E",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1C1C1C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  actionSub: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#222222",
    marginVertical: 14,
  },
  goalBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: "#1E1E1E",
  },
  goalBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
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
    color: "#606060",
    fontSize: 11,
    marginBottom: 10,
  },
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
    color: "#606060",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
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
});

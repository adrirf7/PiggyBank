import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import RollingNumber from "@/components/rolling-number";
import TransactionItem from "@/components/transaction-item";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCategoriesStore } from "@/store/use-categories";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { Period } from "@/types";
import { aggregatePeriodTotals, calculatePercentageChange, compareTransactionsNewestFirst, formatCurrency } from "@/utils/calculations";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { alert } = useAlert();
  const { transactions, deleteTransactions } = useTransactionStore();
  const { allCategories } = useCategoriesStore();
  const { goals } = useSavingsGoalStore();
  const [period, setPeriod] = useState<Period>("month");
  const [periodSlideDirection, setPeriodSlideDirection] = useState<"left" | "right">("left");
  const [periodSelectorWidth, setPeriodSelectorWidth] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const { income, expense, incomeChange, expenseChange, incomeDifference, expenseDifference, incomeTrendSign, expenseTrendSign, incomeTrendColor, expenseTrendColor } =
    useMemo(() => {
      const { currentIncome, currentExpense, previousIncome: prevIncome, previousExpense: prevExpense } = aggregatePeriodTotals(transactions, period);
      const currIncomeChange = calculatePercentageChange(currentIncome, prevIncome);
      const currExpenseChange = calculatePercentageChange(currentExpense, prevExpense);
      const currIncomeDiff = currentIncome - prevIncome;
      const currExpenseDiff = currentExpense - prevExpense;

      return {
        income: currentIncome,
        expense: currentExpense,
        incomeChange: currIncomeChange,
        expenseChange: currExpenseChange,
        incomeDifference: currIncomeDiff,
        expenseDifference: currExpenseDiff,
        incomeTrendSign: currIncomeDiff >= 0 ? "↑" : "↓",
        expenseTrendSign: currExpenseDiff >= 0 ? "↑" : "↓",
        incomeTrendColor: currIncomeChange.isPositive ? "#22c55e" : "#ef4444",
        expenseTrendColor: !currExpenseChange.isPositive ? "#22c55e" : "#ef4444",
      };
    }, [transactions, period]);

  const { balance, totalSaved, totalIncome, totalExpense } = useMemo(() => {
    const incomeAcc = { total: 0, normal: 0, goal: 0 };
    const expenseAcc = { total: 0, normal: 0, goal: 0 };

    for (const tx of transactions) {
      const isIncome = tx.type === "income";
      const target = isIncome ? incomeAcc : expenseAcc;
      target.total += tx.amount;
      if (tx.isGoalContribution) {
        target.goal += tx.amount;
      } else {
        target.normal += tx.amount;
      }
    }

    return {
      balance: incomeAcc.normal - expenseAcc.normal - incomeAcc.goal + expenseAcc.goal,
      totalSaved: incomeAcc.goal - expenseAcc.goal,
      totalIncome: incomeAcc.normal,
      totalExpense: expenseAcc.normal,
    };
  }, [transactions]);

  const periodBalance = income - expense;

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

  const recentTxs = useMemo(() => [...transactions].sort(compareTransactionsNewestFirst).slice(0, 7), [transactions]);
  const goalById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals]);
  const categoriesById = useMemo(() => new Map(allCategories.map((category) => [category.id, category])), [allCategories]);
  const selectedTransactions = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const selectedSet = new Set(selectedIds);
    return recentTxs.filter((tx) => selectedSet.has(tx.id));
  }, [recentTxs, selectedIds]);

  useEffect(() => {
    if (!selectionMode) return;
    const visibleIds = new Set(recentTxs.map((tx) => tx.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [recentTxs, selectionMode]);

  useFocusEffect(
    useCallback(() => {
      const backSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!selectionMode) return false;
        clearSelection();
        return true;
      });

      return () => {
        backSubscription.remove();
      };
    }, [selectionMode, clearSelection]),
  );

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearSelection();
      };
    }, [clearSelection]),
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
  const periodIndex = PERIODS.findIndex(({ key }) => key === period);

  const handlePeriodChange = (nextPeriod: Period) => {
    if (nextPeriod === period) return;
    const nextPeriodIndex = PERIODS.findIndex(({ key }) => key === nextPeriod);
    setPeriodSlideDirection(nextPeriodIndex > periodIndex ? "left" : "right");
    setPeriod(nextPeriod);
  };

  const periodEnteringAnimation = periodSlideDirection === "left" ? SlideInRight.duration(220) : SlideInLeft.duration(220);
  const periodExitingAnimation = periodSlideDirection === "left" ? SlideOutLeft.duration(220) : SlideOutRight.duration(220);
  const periodIndicatorX = useSharedValue(0);

  const periodIndicatorWidth = periodSelectorWidth > 8 ? (periodSelectorWidth - 8) / PERIODS.length : 0;

  useEffect(() => {
    periodIndicatorX.value = withTiming(periodIndex * periodIndicatorWidth, { duration: 220 });
  }, [periodIndex, periodIndicatorWidth, periodIndicatorX]);

  const periodIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: periodIndicatorX.value }],
  }));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((currentId) => currentId !== id) : [...prev, id];
      if (next.length === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  };

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const exitSelectionMode = () => {
    clearSelection();
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.length === 0) return;
    const amountText = selectedTransactions.length === 1 ? "1 transacción" : `${selectedTransactions.length} transacciones`;
    alert("Eliminar transacciones", `¿Seguro que quieres eliminar ${amountText}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTransactions(selectedTransactions);
          exitSelectionMode();
        },
      },
    ]);
  };

  const openTransactionInMovements = (transactionId: string) => {
    router.push({
      pathname: "/(tabs)/transactions",
      params: {
        filter: "all",
        focusTransactionId: transactionId,
        focusNonce: Date.now().toString(),
      },
    });
  };

  const deleteButtonColor = selectedIds.length > 0 ? "#EF4444" : isDark ? "#334155" : "#CBD5E1";

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(400)} className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View>
            <Text className="text-xs text-slate-400 dark:text-slate-500 capitalize">{todayCapitalized}</Text>
            <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </Text>
          </View>
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "#F9731620" }} onPress={() => router.push("/add-transaction")}>
            <Ionicons name="add" size={22} color={PRIMARY} />
          </Pressable>
        </Animated.View>

        {/* ── Balance Card ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} className="mx-5 mt-3">
          <LinearGradient colors={["#d9f634", "#1d9a3f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <RollingNumber value={balance} style={styles.balanceAmount} currencyCode={userProfile?.currencyCode} hasData={transactions.length > 0} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Ingresos totales</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(totalIncome, userProfile?.currencyCode)}</Text>
            </View>
            <View style={[styles.balanceRow, { marginTop: 6 }]}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-up-circle" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Gastos totales</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(totalExpense, userProfile?.currencyCode)}</Text>
            </View>
            <View style={[styles.balanceRow, { marginTop: 6 }]}>
              <View style={styles.balanceStat}>
                <Ionicons name="wallet" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Dinero ahorrado</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(totalSaved, userProfile?.currencyCode)}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Period selector ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          className="relative flex-row mx-5 mt-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1"
          onLayout={(event) => setPeriodSelectorWidth(event.nativeEvent.layout.width)}
        >
          {periodIndicatorWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              className="absolute top-1 bottom-1 rounded-lg"
              style={[
                {
                  left: 4,
                  width: periodIndicatorWidth,
                  backgroundColor: PRIMARY,
                },
                periodIndicatorStyle,
              ]}
            />
          )}
          {PERIODS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => handlePeriodChange(key)} className="flex-1 items-center py-2 rounded-lg">
              <Text className="text-sm font-semibold" style={{ color: period === key ? "#fff" : colors.muted }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        <View className="mx-5 mt-4 overflow-hidden">
          <Animated.View key={period} entering={periodEnteringAnimation} exiting={periodExitingAnimation}>
            {/* ── Stats Cards ── */}
            <View className="flex-row gap-x-3">
              <Pressable
                className="flex-1 rounded-2xl p-4 active:opacity-70"
                style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
                onPress={() => router.push("/transactions?filter=income")}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: INCOME_COLOR + "20" }}>
                    <Ionicons name="arrow-down" size={18} color={INCOME_COLOR} />
                  </View>
                  <View className="rounded-2xl px-2.5 py-1.5" style={{ backgroundColor: incomeTrendColor + "16", borderWidth: 1, borderColor: incomeTrendColor + "35" }}>
                    <View className="flex-row items-center gap-1.5">
                      <Text style={[styles.trendBubbleText, { color: incomeTrendColor }]}>{incomeTrendSign}</Text>
                      <View>
                        <Text style={[styles.trendBubbleAmountText, { color: incomeTrendColor, textAlign: "right" }]}>
                          {formatCurrency(Math.abs(incomeDifference), userProfile?.currencyCode)}
                        </Text>
                        <Text style={[styles.trendBubblePercentText, { color: incomeTrendColor, textAlign: "right" }]}>{Math.abs(incomeChange.percentage).toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">Ingresos</Text>
                <Text className="text-base font-bold" style={{ color: INCOME_COLOR }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(income, userProfile?.currencyCode)}
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 rounded-2xl p-4 active:opacity-70"
                style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
                onPress={() => router.push("/transactions?filter=expense")}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: EXPENSE_COLOR + "20" }}>
                    <Ionicons name="arrow-up" size={18} color={EXPENSE_COLOR} />
                  </View>
                  <View className="rounded-2xl px-2.5 py-1.5" style={{ backgroundColor: expenseTrendColor + "16", borderWidth: 1, borderColor: expenseTrendColor + "35" }}>
                    <View className="flex-row items-center gap-1.5">
                      <Text style={[styles.trendBubbleText, { color: expenseTrendColor }]}>{expenseTrendSign}</Text>
                      <View>
                        <Text style={[styles.trendBubbleAmountText, { color: expenseTrendColor, textAlign: "right" }]}>
                          {formatCurrency(Math.abs(expenseDifference), userProfile?.currencyCode)}
                        </Text>
                        <Text style={[styles.trendBubblePercentText, { color: expenseTrendColor, textAlign: "right" }]}>{Math.abs(expenseChange.percentage).toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">Gastos</Text>
                <Text className="text-base font-bold" style={{ color: EXPENSE_COLOR }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(expense, userProfile?.currencyCode)}
                </Text>
              </Pressable>
            </View>

            {/* ── Period balance ── */}
            {(income > 0 || expense > 0) && (
              <Pressable onPress={() => router.push("/(tabs)/analytics")}>
                <View className="mt-3 rounded-2xl px-4 py-3 flex-row justify-between items-center" style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: (periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR) + "20" }}>
                      <Ionicons name={periodBalance >= 0 ? "trending-up" : "trending-down"} size={16} color={periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                    </View>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Balance del período</Text>
                  </View>
                  <View
                    className="rounded-2xl px-2.5 py-1.5"
                    style={{
                      backgroundColor: (periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR) + "16",
                      borderWidth: 1,
                      borderColor: (periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR) + "35",
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }}>
                      {periodBalance >= 0 ? "+" : ""}
                      {formatCurrency(periodBalance, userProfile?.currencyCode)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* ── Goals Quick Access ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mx-5 mt-3">
          <Pressable
            className="rounded-2xl p-4 flex-row items-center"
            style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
            onPress={() => router.push("/savings-goals")}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: PRIMARY + "15" }}>
              <Ionicons name="trophy-outline" size={20} color={PRIMARY} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Objetivos de ahorro</Text>
              {goals.length === 0 ? (
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Crea tu primer objetivo</Text>
              ) : (
                <>
                  <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {goals.length} objetivo{goals.length !== 1 ? "s" : ""} · {formatCurrency(totalGoalCurrent, userProfile?.currencyCode)} de{" "}
                    {formatCurrency(totalGoalTarget, userProfile?.currencyCode)}
                  </Text>
                  <View className="h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}>
                    <View className="h-full rounded-full" style={{ width: `${goalPercent}%`, backgroundColor: PRIMARY }} />
                  </View>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>

        {/* ── Recent Transactions ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(360)} className="mt-6 mx-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Recientes</Text>
            <View className="flex-row items-center gap-3">
              {selectionMode && (
                <Pressable onPress={exitSelectionMode}>
                  <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancelar</Text>
                </Pressable>
              )}
              {transactions.length > 7 && (
                <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                  <Text className="text-sm font-medium" style={{ color: PRIMARY }}>
                    Ver todo
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          {recentTxs.length > 0 && (
            <Text className="text-xs text-slate-400 dark:text-slate-500 mb-2">
              {selectionMode
                ? `${selectedIds.length} seleccionada${selectedIds.length === 1 ? "" : "s"} · Mantén pulsado para seleccionar`
                : "Mantén pulsado para seleccionar y borrar varias"}
            </Text>
          )}

          {recentTxs.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: PRIMARY + "15" }}>
                <Ionicons name="wallet-outline" size={32} color={PRIMARY} />
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-sm text-center leading-6">
                Aún no hay transacciones.{"\n"}Pulsa{" "}
                <Text className="font-bold" style={{ color: PRIMARY }}>
                  +
                </Text>{" "}
                para añadir la primera.
              </Text>
            </View>
          ) : (
            <>
              {recentTxs.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  goalById={goalById}
                  categoriesById={categoriesById}
                  selectable={selectionMode}
                  selected={selectedIds.includes(tx.id)}
                  onPress={selectionMode ? toggleSelected : openTransactionInMovements}
                  onLongPress={enterSelectionMode}
                />
              ))}
              {selectionMode && <View style={{ height: 90 }} />}
            </>
          )}
        </Animated.View>
      </ScrollView>
      {selectionMode && (
        <Animated.View entering={FadeInDown.duration(400).delay(220)}>
          <Pressable
            className="absolute bottom-8 left-6 right-6 rounded-2xl py-4 items-center justify-center"
            style={[styles.fab, { backgroundColor: deleteButtonColor }]}
            disabled={selectedIds.length === 0}
            onPress={handleDeleteSelected}
          >
            <Text className="text-white font-bold text-sm">Eliminar seleccionadas ({selectedIds.length})</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -40,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 30,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceStat: { flexDirection: "row", alignItems: "center" },
  balanceStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  balanceStatValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  trendBubbleText: { fontSize: 11, lineHeight: 14, fontWeight: "700", includeFontPadding: false },
  trendBubbleAmountText: { fontSize: 11, lineHeight: 13.5, fontWeight: "700", includeFontPadding: false },
  trendBubblePercentText: { fontSize: 10, lineHeight: 12, fontWeight: "700", includeFontPadding: false },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

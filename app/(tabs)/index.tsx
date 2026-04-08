import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionItem from "@/components/transaction-item";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { Period } from "@/types";
import { filterByPeriod, formatCurrency, getBalance, getTotalByType, getTotalSaved } from "@/utils/calculations";

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
  const { user } = useAuth();
  const { transactions } = useTransactionStore();
  const { goals } = useSavingsGoalStore();
  const [period, setPeriod] = useState<Period>("month");

  const filtered = filterByPeriod(transactions, period);
  const income = getTotalByType(filtered, "income");
  const expense = getTotalByType(filtered, "expense");
  const balance = getBalance(transactions);
  const periodBalance = income - expense;
  const totalSaved = getTotalSaved(transactions); // Dinero ahorrado en objetivos

  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalPercent = totalGoalTarget > 0 ? Math.min((totalGoalCurrent / totalGoalTarget) * 100, 100) : 0;

  const recentTxs = transactions.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = user?.displayName?.split(" ")[0] ?? null;

  const today = format(new Date(), "EEEE, d MMMM", { locale: es });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View>
            <Text className="text-xs text-slate-400 dark:text-slate-500 capitalize">{todayCapitalized}</Text>
            <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </Text>
          </View>
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "#F9731620" }} onPress={() => router.push("/add-transaction")}>
            <Ionicons name="add" size={22} color={PRIMARY} />
          </Pressable>
        </View>

        {/* ── Balance Card ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} className="mx-5 mt-3">
          <LinearGradient colors={["#d9f634", "#1d9a3f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Ingresos totales</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(getTotalByType(transactions, "income"))}</Text>
            </View>
            <View style={[styles.balanceRow, { marginTop: 6 }]}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-up-circle" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Gastos totales</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(getTotalByType(transactions, "expense"))}</Text>
            </View>
            <View style={[styles.balanceRow, { marginTop: 6 }]}>
              <View style={styles.balanceStat}>
                <Ionicons name="wallet" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balanceStatLabel}> Dinero ahorrado</Text>
              </View>
              <Text style={styles.balanceStatValue}>{formatCurrency(totalSaved)}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Period selector ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} className="flex-row mx-5 mt-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {PERIODS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => setPeriod(key)} className="flex-1 items-center py-2 rounded-lg" style={period === key ? { backgroundColor: PRIMARY } : undefined}>
              <Text className="text-sm font-semibold" style={{ color: period === key ? "#fff" : colors.muted }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Stats Cards ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} className="flex-row mx-5 mt-4 gap-x-3">
          <View className="flex-1 rounded-2xl p-4" style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
            <View className="w-9 h-9 rounded-full items-center justify-center mb-3" style={{ backgroundColor: INCOME_COLOR + "20" }}>
              <Ionicons name="arrow-down" size={18} color={INCOME_COLOR} />
            </View>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">Ingresos</Text>
            <Text className="text-base font-bold" style={{ color: INCOME_COLOR }} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(income)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl p-4" style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
            <View className="w-9 h-9 rounded-full items-center justify-center mb-3" style={{ backgroundColor: EXPENSE_COLOR + "20" }}>
              <Ionicons name="arrow-up" size={18} color={EXPENSE_COLOR} />
            </View>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">Gastos</Text>
            <Text className="text-base font-bold" style={{ color: EXPENSE_COLOR }} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(expense)}
            </Text>
          </View>
        </Animated.View>

        {/* ── Period balance ── */}
        {(income > 0 || expense > 0) && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(250)}
            className="mx-5 mt-3 rounded-2xl px-4 py-3 flex-row justify-between items-center"
            style={[styles.card, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
          >
            <Text className="text-sm text-slate-500 dark:text-slate-400">Balance del período</Text>
            <Text className="text-sm font-bold" style={{ color: periodBalance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }}>
              {periodBalance >= 0 ? "+" : ""}
              {formatCurrency(periodBalance)}
            </Text>
          </Animated.View>
        )}

        {/* ── Goals Quick Access ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(280)} className="mx-5 mt-3">
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
                    {goals.length} objetivo{goals.length !== 1 ? "s" : ""} · {formatCurrency(totalGoalCurrent)} de {formatCurrency(totalGoalTarget)}
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
        <Animated.View entering={FadeInDown.duration(400).delay(300)} className="mt-6 mx-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Recientes</Text>
            {transactions.length > 5 && (
              <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                <Text className="text-sm font-medium" style={{ color: PRIMARY }}>
                  Ver todo
                </Text>
              </Pressable>
            )}
          </View>

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
            recentTxs.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
          )}
        </Animated.View>
      </ScrollView>
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
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import BarChart from "@/components/bar-chart";
import DonutChart, { DonutSegment } from "@/components/donut-chart";
import { getCategoryById } from "@/constants/categories";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionStore } from "@/store/use-transactions";
import { Period } from "@/types";
import { filterByPeriod, formatCurrency, getCategoryBreakdown, getChartDataForPeriod, getTotalByType } from "@/utils/calculations";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const { transactions } = useTransactionStore();
  const [period, setPeriod] = useState<Period>("month");

  const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const income = getTotalByType(filtered, "income");
  const expense = getTotalByType(filtered, "expense");
  const balance = income - expense;

  const expenseBreakdown = useMemo(() => getCategoryBreakdown(filtered, "expense"), [filtered]);
  const incomeBreakdown = useMemo(() => getCategoryBreakdown(filtered, "income"), [filtered]);
  const chartData = useMemo(() => getChartDataForPeriod(transactions, period), [transactions, period]);

  const expenseSegments: DonutSegment[] = expenseBreakdown.map((d) => ({
    value: d.amount,
    color: getCategoryById(d.category)?.color ?? "#94A3B8",
    label: getCategoryById(d.category)?.name ?? d.category,
  }));

  const incomeSegments: DonutSegment[] = incomeBreakdown.map((d) => ({
    value: d.amount,
    color: getCategoryById(d.category)?.color ?? "#94A3B8",
    label: getCategoryById(d.category)?.name ?? d.category,
  }));

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100">Análisis</Text>
          <Text className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Visualiza tus finanzas</Text>
        </View>

        {/* ── Period selector ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} className="flex-row mx-5 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {PERIODS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => setPeriod(key)} className="flex-1 items-center py-2 rounded-lg" style={period === key ? { backgroundColor: PRIMARY } : undefined}>
              <Text className="text-sm font-semibold" style={{ color: period === key ? "#fff" : colors.muted }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* ── Summary cards ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} className="flex-row mx-5 gap-x-3 mb-4">
          <SummaryCard label="Ingresos" amount={income} color={INCOME_COLOR} icon="arrow-down" cardBg={cardBg} />
          <SummaryCard label="Gastos" amount={expense} color={EXPENSE_COLOR} icon="arrow-up" cardBg={cardBg} />
        </Animated.View>

        {/* ── Balance banner ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="mx-5 mb-5 rounded-2xl px-4 py-3.5 flex-row justify-between items-center"
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          <View>
            <Text className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Balance del período</Text>
            <Text className="text-lg font-bold" style={{ color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }}>
              {balance >= 0 ? "+" : ""}
              {formatCurrency(balance)}
            </Text>
          </View>
          {/* Savings rate */}
          {income > 0 && (
            <View className="items-end">
              <Text className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Tasa de ahorro</Text>
              <Text className="text-lg font-bold" style={{ color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }}>
                {((balance / income) * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Income vs Expense progress bar ── */}
        {(income > 0 || expense > 0) && (
          <Animated.View entering={FadeInDown.duration(400).delay(180)} className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Ingresos vs Gastos</Text>
            <View className="flex-row h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
              {income > 0 && (
                <View
                  style={{
                    width: `${(income / (income + expense)) * 100}%`,
                    backgroundColor: INCOME_COLOR,
                    borderRadius: 99,
                  }}
                />
              )}
              {expense > 0 && (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: EXPENSE_COLOR,
                    borderRadius: 99,
                  }}
                />
              )}
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs text-slate-400">Ingresos {income > 0 ? `${((income / (income + expense)) * 100).toFixed(0)}%` : "0%"}</Text>
              <Text className="text-xs text-slate-400">Gastos {expense > 0 ? `${((expense / (income + expense)) * 100).toFixed(0)}%` : "0%"}</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Bar Chart ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{period === "week" ? "Esta semana" : period === "month" ? "Este mes" : "Este año"}</Text>
          {chartData.every((d) => d.income === 0 && d.expense === 0) ? <EmptyChartState text="Sin datos para este período" /> : <BarChart data={chartData} />}
        </Animated.View>

        {/* ── Expense Donut ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(270)} className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Gastos por categoría</Text>
          {expenseBreakdown.length === 0 ? (
            <EmptyChartState text="Sin gastos en este período" />
          ) : (
            <DonutChartWithLegend
              segments={expenseSegments}
              breakdown={expenseBreakdown}
              total={expense}
              centerLabel={formatCurrencyShort(expense)}
              centerSubLabel="Total gastos"
            />
          )}
        </Animated.View>

        {/* ── Income Donut ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(320)} className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Ingresos por categoría</Text>
          {incomeBreakdown.length === 0 ? (
            <EmptyChartState text="Sin ingresos en este período" />
          ) : (
            <DonutChartWithLegend segments={incomeSegments} breakdown={incomeBreakdown} total={income} centerLabel={formatCurrencyShort(income)} centerSubLabel="Total ingresos" />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, amount, color, icon, cardBg }: { label: string; amount: number; color: string; icon: string; cardBg: string }) {
  return (
    <View className="flex-1 rounded-2xl p-4" style={[styles.card, { backgroundColor: cardBg }]}>
      <View className="w-9 h-9 rounded-full items-center justify-center mb-2" style={{ backgroundColor: color + "20" }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</Text>
      <Text className="text-sm font-bold" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

function DonutChartWithLegend({
  segments,
  breakdown,
  total,
  centerLabel,
  centerSubLabel,
}: {
  segments: DonutSegment[];
  breakdown: { category: string; amount: number; percentage: number }[];
  total: number;
  centerLabel: string;
  centerSubLabel: string;
}) {
  return (
    <View className="items-center">
      <DonutChart data={segments} radius={80} strokeWidth={24} centerLabel={centerLabel} centerSubLabel={centerSubLabel} />
      {/* Legend */}
      <View className="w-full mt-4 gap-y-2">
        {breakdown.slice(0, 6).map((item) => {
          const cat = getCategoryById(item.category);
          return (
            <View key={item.category} className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: cat?.color ?? "#94A3B8" }} />
              <Text className="flex-1 text-xs text-slate-600 dark:text-slate-300" numberOfLines={1}>
                {cat?.name ?? item.category}
              </Text>
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">{item.percentage.toFixed(0)}%</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 w-24 text-right">{formatCurrency(item.amount)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <View className="items-center py-8">
      <Ionicons name="bar-chart-outline" size={40} color="#CBD5E1" />
      <Text className="text-xs text-slate-400 mt-2 text-center">{text}</Text>
    </View>
  );
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k€`;
  return `${amount.toFixed(0)}€`;
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});

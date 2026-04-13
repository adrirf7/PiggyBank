import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import BarChart from "@/components/bar-chart";
import DonutChart, { DonutSegment } from "@/components/donut-chart";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/auth";
import { useCategoriesStore } from "@/store/use-categories";
import { useTransactionStore } from "@/store/use-transactions";
import { Category, Period } from "@/types";
import {
    calculatePercentageChange,
    filterByPeriod,
    filterByPreviousPeriod,
    formatCurrency,
    getCategoryBreakdown,
    getChartDataForPeriod,
    getTotalByType,
} from "@/utils/calculations";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

export default function AnalyticsScreen() {
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { transactions } = useTransactionStore();
  const { allCategories } = useCategoriesStore();
  const [period, setPeriod] = useState<Period>("month");
  const [periodSlideDirection, setPeriodSlideDirection] = useState<"left" | "right">("left");
  const [periodSelectorWidth, setPeriodSelectorWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const filtered = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const previousFiltered = useMemo(() => filterByPreviousPeriod(transactions, period), [transactions, period]);
  const income = getTotalByType(filtered, "income");
  const expense = getTotalByType(filtered, "expense");
  const previousIncome = getTotalByType(previousFiltered, "income");
  const previousExpense = getTotalByType(previousFiltered, "expense");
  const incomeChange = calculatePercentageChange(income, previousIncome);
  const expenseChange = calculatePercentageChange(expense, previousExpense);
  
  // Diferencias en dinero
  const incomeDifference = income - previousIncome;
  const expenseDifference = expense - previousExpense;
  
  const balance = income - expense;

  const expenseBreakdown = useMemo(() => getCategoryBreakdown(filtered, "expense"), [filtered]);
  const incomeBreakdown = useMemo(() => getCategoryBreakdown(filtered, "income"), [filtered]);
  const chartData = useMemo(() => getChartDataForPeriod(transactions, period), [transactions, period]);

  const categoriesById = useMemo(() => new Map<string, Category>(allCategories.map((category) => [category.id, category])), [allCategories]);
  const expenseSegments: DonutSegment[] = expenseBreakdown.map((d) => ({
    value: d.amount,
    color: categoriesById.get(d.category)?.color ?? "#94A3B8",
    label: categoriesById.get(d.category)?.name ?? d.category,
  }));

  const incomeSegments: DonutSegment[] = incomeBreakdown.map((d) => ({
    value: d.amount,
    color: categoriesById.get(d.category)?.color ?? "#94A3B8",
    label: categoriesById.get(d.category)?.name ?? d.category,
  }));

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const currency = userProfile?.currencyCode;
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

  useFocusEffect(
    useCallback(() => {
      setPeriod("month");
      setPeriodSlideDirection("left");
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, []),
  );

  const periodIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: periodIndicatorX.value }],
  }));

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100">Análisis</Text>
          <Text className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Visualiza tus finanzas</Text>
        </View>

        {/* ── Period selector ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          className="relative flex-row mx-5 mb-5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1"
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

        <View className="mx-5 overflow-hidden">
          <Animated.View key={period} entering={periodEnteringAnimation} exiting={periodExitingAnimation}>
            {/* ── Summary cards ── */}
            <View className="flex-row gap-x-3 mb-4">
              <SummaryCard label="Ingresos" amount={income} color={INCOME_COLOR} icon="arrow-down" cardBg={cardBg} percentageChange={incomeChange} difference={incomeDifference} onPress={() => router.push("/transactions?filter=income")} currency={currency} />
              <SummaryCard label="Gastos" amount={expense} color={EXPENSE_COLOR} icon="arrow-up" cardBg={cardBg} percentageChange={expenseChange} difference={expenseDifference} isExpense={true} onPress={() => router.push("/transactions?filter=expense")} currency={currency} />
            </View>

            {/* ── Balance banner ── */}
            <View className="mb-5 rounded-2xl px-4 py-3.5 flex-row justify-between items-center" style={[styles.card, { backgroundColor: cardBg }]}>
              <View>
                <Text className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Balance del período</Text>
                <Text className="text-lg font-bold" style={{ color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }}>
                  {balance >= 0 ? "+" : ""}
                  {formatCurrency(balance, currency)}
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
            </View>
          </Animated.View>
        </View>

        {/* ── Income vs Expense progress bar ── */}
        {(income > 0 || expense > 0) && (
          <View className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
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
          </View>
        )}

        {/* ── Bar Chart ── */}
        <View className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{period === "week" ? "Esta semana" : period === "month" ? "Este mes" : "Este año"}</Text>
          {chartData.every((d) => d.income === 0 && d.expense === 0) ? <EmptyChartState text="Sin datos para este período" /> : <BarChart data={chartData} />}
        </View>

        {/* ── Expense Donut ── */}
        <View className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Gastos por categoría</Text>
          {expenseBreakdown.length === 0 ? (
            <EmptyChartState text="Sin gastos en este período" />
          ) : (
            <DonutChartWithLegend segments={expenseSegments} breakdown={expenseBreakdown} total={expense} centerLabel={formatCurrencyShort(expense, currency)} centerSubLabel="Total gastos" categoriesById={categoriesById} currency={currency} />
          )}
        </View>

        {/* ── Income Donut ── */}
        <View className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Ingresos por categoría</Text>
          {incomeBreakdown.length === 0 ? (
            <EmptyChartState text="Sin ingresos en este período" />
          ) : (
            <DonutChartWithLegend segments={incomeSegments} breakdown={incomeBreakdown} total={income} centerLabel={formatCurrencyShort(income, currency)} centerSubLabel="Total ingresos" categoriesById={categoriesById} currency={currency} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label,
  amount,
  color,
  icon,
  cardBg,
  percentageChange,
  difference,
  isExpense = false,
  onPress,
  currency,
}: {
  label: string;
  amount: number;
  color: string;
  icon: string;
  cardBg: string;
  percentageChange?: { percentage: number; isPositive: boolean };
  difference?: number;
  isExpense?: boolean;
  onPress?: () => void;
  currency?: string;
}) {
  const getChangeColor = () => {
    if (!percentageChange) return color;
    if (isExpense) {
      return !percentageChange.isPositive ? "#22c55e" : "#ef4444";
    } else {
      return percentageChange.isPositive ? "#22c55e" : "#ef4444";
    }
  };

  const getTrendSign = () => {
    if (!percentageChange) return "";
    return percentageChange.isPositive ? "↑" : "↓";
  };

  return (
    <Pressable 
      className="flex-1 rounded-2xl p-4 active:opacity-70" 
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: color + "20" }}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        {percentageChange && difference !== undefined && (
          <View className="rounded-2xl px-2.5 py-1.5" style={{ backgroundColor: getChangeColor() + "16", borderWidth: 1, borderColor: getChangeColor() + "35" }}>
            <View className="flex-row items-center gap-1.5">
              <Text style={[styles.trendBubbleText, { color: getChangeColor() }]}>{getTrendSign()}</Text>
              <View>
                <Text style={[styles.trendBubbleAmountText, { color: getChangeColor(), textAlign: "right" }]}>{formatCurrency(Math.abs(difference), currency)}</Text>
                <Text style={[styles.trendBubblePercentText, { color: getChangeColor(), textAlign: "right" }]}>{Math.abs(percentageChange.percentage).toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</Text>
      <Text className="text-base font-bold" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount, currency)}
      </Text>
    </Pressable>
  );
}

  function DonutChartWithLegend({
  segments,
  breakdown,
  total,
  centerLabel,
  centerSubLabel,
  categoriesById,
  currency,
}: {
  segments: DonutSegment[];
  breakdown: { category: string; amount: number; percentage: number }[];
  total: number;
  centerLabel: string;
  centerSubLabel: string;
  categoriesById: Map<string, Category>;
  currency?: string;
}) {
  return (
    <View className="items-center">
      <DonutChart data={segments} radius={80} strokeWidth={24} centerLabel={centerLabel} centerSubLabel={centerSubLabel} />
      {/* Legend */}
      <View className="w-full mt-4 gap-y-2">
        {breakdown.slice(0, 6).map((item) => {
          const cat = categoriesById.get(item.category);
          return (
            <View key={item.category} className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: cat?.color ?? "#94A3B8" }} />
              <Text className="flex-1 text-xs text-slate-600 dark:text-slate-300" numberOfLines={1}>
                {cat?.name ?? item.category}
              </Text>
              <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">{item.percentage.toFixed(0)}%</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 w-24 text-right">{formatCurrency(item.amount, currency)}</Text>
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

function formatCurrencyShort(amount: number, currency?: string): string {
  const formatted = formatCurrency(amount, currency);
  if (amount >= 1000) {
    const compact = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
    return compact;
  }
  return formatted;
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  trendBubbleText: { fontSize: 11, lineHeight: 14, fontWeight: "700", includeFontPadding: false },
  trendBubbleAmountText: { fontSize: 11, lineHeight: 13.5, fontWeight: "700", includeFontPadding: false },
  trendBubblePercentText: { fontSize: 10, lineHeight: 12, fontWeight: "700", includeFontPadding: false },
});

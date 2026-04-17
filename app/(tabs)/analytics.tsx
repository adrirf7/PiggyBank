import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, addMonths, addWeeks, addYears, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks, subYears } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, NativeScrollEvent, NativeSyntheticEvent, NativeTouchEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import BarChart from "@/components/bar-chart";
import { BreakdownChart } from "@/components/breakdown-chart";
import { DonutSegment } from "@/components/donut-chart";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useCategoriesStore } from "@/store/use-categories";
import { useTransactionStore } from "@/store/use-transactions";
import { Category, Period } from "@/types";
import { aggregatePeriodTotals, calculatePercentageChange, filterByPeriod, formatCurrency, getCategoryBreakdown, getChartDataForPeriod } from "@/utils/calculations";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

type MixedMode = "expense-categories" | "income-categories";
interface MixedSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  hasData?: boolean[];
  elapsedMask?: boolean[];
}
interface RenderSeries extends MixedSeries {
  startDataIndex: number;
  lastDataIndex: number;
  drawAllAsZero: boolean;
}
type PrimaryChartMode = "bars" | "lines";
type MonthXAxisMode = "weeks" | "days";
const MIXED_MODES: { key: MixedMode; label: string }[] = [
  { key: "expense-categories", label: "Categorías de gastos" },
  { key: "income-categories", label: "Categorías de ingresos" },
];

export default function AnalyticsScreen() {
  const { userProfile } = useAuth();
  const colors = Colors.dark;
  const isDark = true;
  const router = useRouter();
  const { transactions } = useTransactionStore();
  const { allCategories } = useCategoriesStore();
  const [period, setPeriod] = useState<Period>("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [periodSlideDirection, setPeriodSlideDirection] = useState<"left" | "right">("left");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [primaryChartMode, setPrimaryChartMode] = useState<PrimaryChartMode>("bars");
  const [monthXAxisMode, setMonthXAxisMode] = useState<MonthXAxisMode>("weeks");
  const [mixedMonthXAxisMode, setMixedMonthXAxisMode] = useState<MonthXAxisMode>("weeks");
  const [chartSwipeDirection, setChartSwipeDirection] = useState<"left" | "right">("left");
  const [mixedChartSwipeDirection, setMixedChartSwipeDirection] = useState<"left" | "right">("left");
  const [mixedMode, setMixedMode] = useState<MixedMode>("expense-categories");
  const [isChartTouchActive, setIsChartTouchActive] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const filtered = useMemo(() => filterByPeriod(transactions, period, referenceDate), [transactions, period, referenceDate]);
  const {
    currentIncome: income,
    currentExpense: expense,
    previousIncome,
    previousExpense,
  } = useMemo(() => aggregatePeriodTotals(transactions, period, referenceDate), [transactions, period, referenceDate]);
  const incomeChange = calculatePercentageChange(income, previousIncome);
  const expenseChange = calculatePercentageChange(expense, previousExpense);

  // Diferencias en dinero
  const incomeDifference = income - previousIncome;
  const expenseDifference = expense - previousExpense;

  const balance = income - expense;

  const expenseBreakdown = useMemo(() => getCategoryBreakdown(filtered, "expense"), [filtered]);
  const incomeBreakdown = useMemo(() => getCategoryBreakdown(filtered, "income"), [filtered]);
  const chartData = useMemo(() => getChartDataForPeriod(transactions, period, referenceDate), [transactions, period, referenceDate]);
  
  // Enriquecer chartData con dayLabel/weekLabel
  const chartDataEnriched = useMemo(() => {
    return chartData.map((item, index) => {
      if (period === "month") {
        // En modo mes, mostrar "Semana X"
        return { ...item, dayLabel: `Semana ${index + 1}` };
      }
      return item;
    });
  }, [chartData, period]);
  
  const parsedFilteredMeta = useMemo(
    () =>
      filtered.map((transaction) => {
        const parsedDate = parseISO(transaction.date);
        return {
          transaction,
          weekIndex: (parsedDate.getDay() + 6) % 7,
          monthDayIndex: parsedDate.getDate() - 1,
          monthWeekIndex: Math.floor((parsedDate.getDate() - 1) / 7),
          yearMonthIndex: parsedDate.getMonth(),
        };
      }),
    [filtered],
  );

  const chartDataDailyMonth = useMemo(() => {
    if (period !== "month") return chartData;
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    const days = end.getDate();
    const dailyTotals = new Map<string, { income: number; expense: number }>();

    for (const transaction of transactions) {
      const current = dailyTotals.get(transaction.date) ?? { income: 0, expense: 0 };
      if (!transaction.isGoalContribution) {
        if (transaction.type === "income") current.income += transaction.amount;
        if (transaction.type === "expense") current.expense += transaction.amount;
      }
      dailyTotals.set(transaction.date, current);
    }

    return Array.from({ length: days }, (_, i) => {
      const day = addDays(start, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const totals = dailyTotals.get(dayStr) ?? { income: 0, expense: 0 };
      return {
        label: `${i + 1}`,
        dayLabel: `Día ${i + 1}`,
        income: totals.income,
        expense: totals.expense,
      };
    });
  }, [chartData, period, referenceDate, transactions]);
  const primaryChartData = period === "month" && monthXAxisMode === "days" ? chartDataDailyMonth : chartDataEnriched;
  const isMonthDaysMode = period === "month" && monthXAxisMode === "days";
  const primaryChartLabels = useMemo(() => {
    return primaryChartData.map((d) => {
      if (isMonthDaysMode) {
        return `Día ${d.label}`;
      }
      return d.label;
    });
  }, [primaryChartData, isMonthDaysMode]);
  const categoriesById = useMemo(() => new Map<string, Category>(allCategories.map((category) => [category.id, category])), [allCategories]);
  const primarySeriesHasData = useMemo(() => {
    const length = primaryChartData.length;
    const income = Array.from({ length }, () => false);
    const expense = Array.from({ length }, () => false);
    parsedFilteredMeta.forEach(({ transaction: t, weekIndex, monthDayIndex, monthWeekIndex, yearMonthIndex }) => {
      if (t.isGoalContribution) return;
      let idx = -1;
      if (period === "week") {
        idx = weekIndex;
      } else if (period === "month") {
        idx = monthXAxisMode === "days" ? monthDayIndex : monthWeekIndex;
      } else {
        idx = yearMonthIndex;
      }
      if (idx < 0 || idx >= length) return;
      if (t.type === "income") income[idx] = true;
      if (t.type === "expense") expense[idx] = true;
    });
    return { income, expense };
  }, [parsedFilteredMeta, monthXAxisMode, period, primaryChartData.length]);
  const primarySeriesElapsed = useMemo(() => {
    const length = primaryChartData.length;
    const elapsed = Array.from({ length }, () => false);
    const today = new Date();

    if (period === "week") {
      const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
      for (let i = 0; i < length; i++) {
        elapsed[i] = addDays(weekStart, i) <= today;
      }
      return elapsed;
    }

    if (period === "month") {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      for (let i = 0; i < length; i++) {
        const day = monthXAxisMode === "days" ? i + 1 : i * 7 + 1;
        elapsed[i] = new Date(year, month, day) <= today;
      }
      return elapsed;
    }

    const year = referenceDate.getFullYear();
    for (let i = 0; i < length; i++) {
      elapsed[i] = new Date(year, i, 1) <= today;
    }
    return elapsed;
  }, [monthXAxisMode, period, primaryChartData.length, referenceDate]);
  const hasPrimaryRecords = useMemo(() => primarySeriesHasData.income.some(Boolean) || primarySeriesHasData.expense.some(Boolean), [primarySeriesHasData]);
  const expenseSegments: DonutSegment[] = expenseBreakdown.map((d) => ({
    value: d.amount,
    color: categoriesById.get(d.category)?.color ?? colors.muted,
    label: categoriesById.get(d.category)?.name ?? d.category,
  }));

  const incomeSegments: DonutSegment[] = incomeBreakdown.map((d) => ({
    value: d.amount,
    color: categoriesById.get(d.category)?.color ?? colors.muted,
    label: categoriesById.get(d.category)?.name ?? d.category,
  }));

  const mixedChartData = period === "month" && mixedMonthXAxisMode === "days" ? chartDataDailyMonth : chartDataEnriched;
  const isMixedMonthDaysMode = period === "month" && mixedMonthXAxisMode === "days";
  const mixedChartLabels = mixedChartData.map((d) => {
    if (isMixedMonthDaysMode) {
      return `Día ${d.label}`;
    }
    return d.label;
  });
  const mixedSeries = useMemo<MixedSeries[]>(() => {
    const source = mixedMode === "expense-categories" ? expenseBreakdown : incomeBreakdown;
    const type = mixedMode === "expense-categories" ? "expense" : "income";
    const top = source.slice(0, 5);
    const topCategorySet = new Set(top.map((item) => item.category));
    const bucketCount = mixedChartLabels.length;
    const valuesByCategory = new Map<string, number[]>(top.map((item) => [item.category, Array.from({ length: bucketCount }, () => 0)]));

    for (const { transaction, weekIndex, monthDayIndex, monthWeekIndex, yearMonthIndex } of parsedFilteredMeta) {
      if (transaction.isGoalContribution || transaction.type !== type || !topCategorySet.has(transaction.category)) continue;
      const values = valuesByCategory.get(transaction.category);
      if (!values) continue;

      let bucketIndex = -1;
      if (period === "week") {
        bucketIndex = weekIndex;
      } else if (period === "month") {
        bucketIndex = mixedMonthXAxisMode === "days" ? monthDayIndex : monthWeekIndex;
      } else {
        bucketIndex = yearMonthIndex;
      }

      if (bucketIndex >= 0 && bucketIndex < values.length) {
        values[bucketIndex] += transaction.amount;
      }
    }

    return top.map((item) => ({
      key: item.category,
      label: categoriesById.get(item.category)?.name ?? item.category,
      color: categoriesById.get(item.category)?.color ?? (type === "expense" ? EXPENSE_COLOR : INCOME_COLOR),
      values: valuesByCategory.get(item.category) ?? Array.from({ length: bucketCount }, () => 0),
    }));
  }, [mixedChartLabels, mixedMode, expenseBreakdown, incomeBreakdown, categoriesById, parsedFilteredMeta, period, mixedMonthXAxisMode]);

  const cardBg = colors.card;
  const currency = userProfile?.currencyCode;
  const periodIndex = PERIODS.findIndex(({ key }) => key === period);
  const periodLabel = PERIODS.find(({ key }) => key === period)?.label ?? "Mes";

  const handlePeriodChange = (nextPeriod: Period) => {
    if (nextPeriod === period) {
      setIsPeriodDropdownOpen(false);
      return;
    }
    const nextPeriodIndex = PERIODS.findIndex(({ key }) => key === nextPeriod);
    setPeriodSlideDirection(nextPeriodIndex > periodIndex ? "left" : "right");
    setReferenceDate(new Date());
    setPeriod(nextPeriod);
    setIsPeriodDropdownOpen(false);
  };

  const movePeriod = (direction: "previous" | "next") => {
    setPeriodSlideDirection(direction === "next" ? "left" : "right");
    setReferenceDate((prev) => {
      switch (period) {
        case "week":
          return direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1);
        case "month":
          return direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1);
        case "year":
          return direction === "next" ? addYears(prev, 1) : subYears(prev, 1);
      }
    });
  };

  const periodRangeLabel = useMemo(() => {
    if (period === "week") {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
    }

    if (period === "month") {
      const month = format(referenceDate, "MMMM", { locale: es });
      return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${format(referenceDate, "yyyy", { locale: es })}`;
    }

    return format(referenceDate, "yyyy", { locale: es });
  }, [period, referenceDate]);

  const periodContentKey = useMemo(() => {
    if (period === "week") {
      return `${period}-${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "yyyy-MM-dd")}`;
    }
    if (period === "month") {
      return `${period}-${format(referenceDate, "yyyy-MM")}`;
    }
    return `${period}-${format(referenceDate, "yyyy")}`;
  }, [period, referenceDate]);

  const chartTitle = useMemo(() => {
    if (period === "week") return "Semana seleccionada";
    if (period === "month") return monthXAxisMode === "days" ? "Mes seleccionado (días)" : "Mes seleccionado";
    return "Año seleccionado";
  }, [monthXAxisMode, period]);
  const closeSelectors = useCallback(() => {
    setIsPeriodDropdownOpen(false);
  }, []);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event.nativeEvent.contentOffset.y > 2) closeSelectors();
    },
    [closeSelectors],
  );
  const toggleMonthXAxisModeBySwipe = useCallback(
    (direction: "left" | "right") => {
      if (period !== "month") return;
      setChartSwipeDirection(direction);
      setMonthXAxisMode((prev) => (prev === "weeks" ? "days" : "weeks"));
    },
    [period],
  );
  const toggleMixedMonthXAxisMode = useCallback(
    (direction: "left" | "right") => {
      if (period !== "month") return;
      setMixedChartSwipeDirection(direction);
      setMixedMonthXAxisMode((prev) => (prev === "weeks" ? "days" : "weeks"));
    },
    [period],
  );

  useEffect(() => {
    setIsPeriodDropdownOpen(false);
  }, [period]);

  const periodEnteringAnimation = periodSlideDirection === "left" ? SlideInRight.duration(220) : SlideInLeft.duration(220);
  const periodExitingAnimation = periodSlideDirection === "left" ? SlideOutLeft.duration(220) : SlideOutRight.duration(220);

  useFocusEffect(
    useCallback(() => {
      closeSelectors();
      setPeriod("month");
      setReferenceDate(new Date());
      setPeriodSlideDirection("left");
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
      return () => {
        closeSelectors();
      };
    }, [closeSelectors]),
  );

  useEffect(() => {
    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isPeriodDropdownOpen) return false;
      closeSelectors();
      return true;
    });
    return () => backSub.remove();
  }, [closeSelectors, isPeriodDropdownOpen]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isChartTouchActive}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-3 pb-2.5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100">Análisis</Text>
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Visualiza tus finanzas</Text>
            </View>
            <View className="relative">
              <Pressable
                className="flex-row items-center rounded-xl px-3 py-2"
                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setIsPeriodDropdownOpen((prev) => !prev)}
              >
                <Text className="text-sm font-semibold mr-1.5" style={{ color: colors.text }}>
                  {periodLabel}
                </Text>
                <Ionicons name={isPeriodDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </Pressable>
              {isPeriodDropdownOpen && (
                <View
                  style={[
                    styles.periodDropdown,
                    {
                      backgroundColor: cardBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {PERIODS.map(({ key, label }) => (
                    <Pressable
                      key={key}
                      onPress={() => handlePeriodChange(key)}
                      style={[styles.periodDropdownItem, period === key ? { backgroundColor: PRIMARY + "14" } : undefined]}
                    >
                      <Text style={{ color: period === key ? PRIMARY : colors.text, fontWeight: period === key ? "700" : "600" }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          className="mx-5 mb-5 flex-row items-center justify-between rounded-2xl px-3 py-2.5"
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          <Pressable onPress={() => movePeriod("previous")} className="w-9 h-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.background }}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text className="text-sm font-semibold text-center px-2" style={{ color: colors.text }}>
            {periodRangeLabel}
          </Text>
          <Pressable onPress={() => movePeriod("next")} className="w-9 h-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.background }}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </Animated.View>

        <View className="mx-5 overflow-hidden">
          <Animated.View key={periodContentKey} entering={periodEnteringAnimation} exiting={periodExitingAnimation}>
            {/* ── Summary cards ── */}
            <View className="flex-row gap-x-3 mb-4">
              <SummaryCard
                label="Ingresos"
                amount={income}
                color={INCOME_COLOR}
                icon="arrow-down"
                cardBg={cardBg}
                percentageChange={incomeChange}
                difference={incomeDifference}
                onPress={() => router.push("/transactions?filter=income")}
                currency={currency}
              />
              <SummaryCard
                label="Gastos"
                amount={expense}
                color={EXPENSE_COLOR}
                icon="arrow-up"
                cardBg={cardBg}
                percentageChange={expenseChange}
                difference={expenseDifference}
                isExpense={true}
                onPress={() => router.push("/transactions?filter=expense")}
                currency={currency}
              />
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
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">{chartTitle}</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mb-4">{periodRangeLabel}</Text>
              {period === "month" && (
                <View className="flex-row items-center gap-x-2 mb-2">
                  <Pressable
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => toggleMonthXAxisModeBySwipe("right")}
                  >
                    <Ionicons name="chevron-back" size={12} color={colors.muted} />
                  </Pressable>
                  <Text className="text-[11px] text-slate-400 dark:text-slate-500">Eje X: {monthXAxisMode === "weeks" ? "semanas" : "días"}</Text>
                  <Pressable
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => toggleMonthXAxisModeBySwipe("left")}
                  >
                    <Ionicons name="chevron-forward" size={12} color={colors.muted} />
                  </Pressable>
                </View>
              )}
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPrimaryChartMode("bars")}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: primaryChartMode === "bars" ? PRIMARY : colors.border }}
              >
                <Text className="text-xs font-semibold" style={{ color: primaryChartMode === "bars" ? "#fff" : colors.text }}>
                  Barras
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPrimaryChartMode("lines")}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: primaryChartMode === "lines" ? PRIMARY : colors.border }}
              >
                <Text className="text-xs font-semibold" style={{ color: primaryChartMode === "lines" ? "#fff" : colors.text }}>
                  Líneas
                </Text>
              </Pressable>
            </View>
          </View>
          {!hasPrimaryRecords ? (
            <EmptyChartState text="Sin datos para este período" />
          ) : (
            <Animated.View
              key={`primary-chart-${monthXAxisMode}-${primaryChartMode}`}
              entering={chartSwipeDirection === "left" ? SlideInRight.duration(180) : SlideInLeft.duration(180)}
              exiting={chartSwipeDirection === "left" ? SlideOutLeft.duration(180) : SlideOutRight.duration(180)}
            >
              {primaryChartMode === "bars" ? (
                <BarChart data={primaryChartData} isDark={isDark} currencyCode={currency} onTouchActiveChange={setIsChartTouchActive} />
              ) : (
               <MixedAreaChart
                  labels={primaryChartLabels}
                  series={[
                    {
                      key: "income",
                      label: "Ingresos",
                      color: INCOME_COLOR,
                      values: primaryChartData.map((d) => d.income),
                      hasData: primarySeriesHasData.income,
                      elapsedMask: primarySeriesElapsed,
                    },
                    {
                      key: "expense",
                      label: "Gastos",
                      color: EXPENSE_COLOR,
                      values: primaryChartData.map((d) => d.expense),
                      hasData: primarySeriesHasData.expense,
                      elapsedMask: primarySeriesElapsed,
                    },
                  ]}
                  lineStyle="straight"
                  isDark={isDark}
                  currency={currency}
                  onTouchActiveChange={setIsChartTouchActive}
                />
              )}
            </Animated.View>
          )}
        </View>

        {/* ── Unified Breakdown Charts ── */}
        <BreakdownChart
          incomeSegments={incomeSegments}
          incomeBreakdown={incomeBreakdown}
          expenseSegments={expenseSegments}
          expenseBreakdown={expenseBreakdown}
          totalIncome={income}
          totalExpense={expense}
          categoriesById={categoriesById}
          currency={currency}
          cardBg={cardBg}
        />

        {/* ── Mixed area chart (extra) ── */}
        <View className="mx-5 mb-5 rounded-2xl px-4 py-4" style={[styles.card, { backgroundColor: cardBg }]}>
          <View className="flex-row items-start justify-between mb-3">
            <View>
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Comparativa avanzada</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{periodRangeLabel}</Text>
              {period === "month" && (
                <View className="flex-row items-center gap-x-2 mt-2">
                  <Pressable
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => toggleMixedMonthXAxisMode("right")}
                  >
                    <Ionicons name="chevron-back" size={12} color={colors.muted} />
                  </Pressable>
                  <Text className="text-[11px] text-slate-400 dark:text-slate-500">Eje X: {mixedMonthXAxisMode === "weeks" ? "semanas" : "días"}</Text>
                  <Pressable
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => toggleMixedMonthXAxisMode("left")}
                  >
                    <Ionicons name="chevron-forward" size={12} color={colors.muted} />
                  </Pressable>
                </View>
              )}
            </View>
            <View className="flex-row gap-2">
              {MIXED_MODES.map((mode) => (
                <Pressable
                  key={mode.key}
                  onPress={() => setMixedMode(mode.key)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: mixedMode === mode.key ? PRIMARY : colors.border }}
                >
                  <Text className="text-xs font-semibold" style={{ color: mixedMode === mode.key ? "#fff" : colors.text }}>
                    {mode.key === "expense-categories" ? "Gastos" : "Ingresos"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {mixedSeries.length === 0 ? (
            <EmptyChartState text="Sin datos para este modo en el período seleccionado" />
          ) : (
            <Animated.View
              key={`mixed-chart-${mixedMonthXAxisMode}-${mixedMode}`}
              entering={mixedChartSwipeDirection === "left" ? SlideInRight.duration(180) : SlideInLeft.duration(180)}
              exiting={mixedChartSwipeDirection === "left" ? SlideOutLeft.duration(180) : SlideOutRight.duration(180)}
            >
              <MixedAreaChart labels={mixedChartLabels} series={mixedSeries} isDark={isDark} currency={currency} onTouchActiveChange={setIsChartTouchActive} />
            </Animated.View>
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
    <Pressable className="flex-1 rounded-2xl p-4 active:opacity-70" style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress}>
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

function MixedAreaChart({
  labels,
  series,
  isDark,
  currency,
  onTouchActiveChange,
  lineStyle = "smooth",
}: {
  labels: string[];
  series: MixedSeries[];
  isDark: boolean;
  currency?: string;
  onTouchActiveChange?: (isActive: boolean) => void;
  lineStyle?: "smooth" | "straight";
}) {
  const width = 320;
  const height = 220;
  const leftPad = 44;
  const rightPad = 8;
  const topPad = 10;
  const bottomPad = 30;
  const chartW = width - leftPad - rightPad;
  const chartH = height - topPad - bottomPad;
  const isStraightLineChart = lineStyle === "straight";
  const renderSeries = useMemo<RenderSeries[]>(() => {
    return series.map((s) => {
      if (!isStraightLineChart) {
        return { ...s, startDataIndex: 0, lastDataIndex: s.values.length - 1, drawAllAsZero: false };
      }
      const hasData = s.hasData ?? s.values.map((v) => v !== 0);
      const elapsedMask = s.elapsedMask ?? s.values.map(() => true);
      let first = hasData.findIndex(Boolean);
      let last = -1;
      for (let i = elapsedMask.length - 1; i >= 0; i--) {
        if (elapsedMask[i]) {
          last = i;
          break;
        }
      }
      let drawAllAsZero = false;
      if (first === -1) {
        first = 0;
        drawAllAsZero = last >= 0;
      } else if (last >= 0) {
        last = Math.max(first, last);
      }
      const values = drawAllAsZero
        ? s.values.map(() => 0)
        : s.values.map((value, i) => {
            if (i < first || i > last) return value;
            return hasData[i] ? value : 0;
          });
      return { ...s, values, hasData, elapsedMask, startDataIndex: first, lastDataIndex: last, drawAllAsZero };
    });
  }, [isStraightLineChart, series]);
  const rawMaxVal = Math.max(1, ...renderSeries.flatMap((s) => s.values));
  const paddedMaxVal = isStraightLineChart ? rawMaxVal * 1.12 : rawMaxVal;
  const nonZeroValues = renderSeries.flatMap((s) => s.values.filter((v) => v > 0));
  const minNonZeroVal = nonZeroValues.length > 0 ? Math.max(1, Math.min(...nonZeroValues)) : 1;
  const rangeRatio = paddedMaxVal / minNonZeroVal;
  const yIntervals = isStraightLineChart && rangeRatio >= 15 ? 8 : 4;
  const yStepRaw = paddedMaxVal / yIntervals;
  const yExp = Math.floor(Math.log10(Math.max(1, yStepRaw)));
  const yMagnitude = Math.pow(10, yExp);
  const yFraction = yStepRaw / yMagnitude;
  const yNiceFraction = yFraction <= 1 ? 1 : yFraction <= 2 ? 2 : yFraction <= 5 ? 5 : 10;
  const yStep = yNiceFraction * yMagnitude;
  const yMax = yStep * yIntervals;
  const xStep = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
  const LONG_PRESS_DELAY_MS = 220;
  const MOVE_CANCEL_THRESHOLD = 8;
  const yTicks = Array.from({ length: yIntervals + 1 }, (_, i) => i / yIntervals);
  const verticalXLabels = labels.length > 12;
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(null);
  const [touchState, setTouchState] = useState<{ active: boolean; x: number; index: number }>({ active: false, x: leftPad, index: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const lastXRef = useRef(leftPad);
  const chartBoundsRef = useRef<{ left: number; width: number }>({ left: 0, width });
  const chartContainerRef = useRef<View>(null);

  const visibleSeries = useMemo(() => {
    if (!selectedSeriesKey) return renderSeries;
    const hit = renderSeries.find((s) => s.key === selectedSeriesKey);
    return hit ? [hit] : renderSeries;
  }, [selectedSeriesKey, renderSeries]);

  const pointsForSeries = (s: RenderSeries, startIndex = s.startDataIndex, endIndex = s.lastDataIndex) => {
    const values = s.values;
    if (values.length === 0) return [] as { x: number; y: number }[];
    const start = Math.max(0, Math.min(values.length - 1, startIndex));
    const end = Math.max(-1, Math.min(values.length - 1, endIndex));
    if (end < start) return [] as { x: number; y: number }[];
    const minY = topPad;
    const maxY = topPad + chartH;
    return values.slice(start, end + 1).flatMap((v, offset) => {
      const i = start + offset;
      const normalized = Math.min(1, Math.max(0, v / yMax));
      const rawY = topPad + chartH - normalized * chartH;
      const y = Math.min(maxY, Math.max(minY, rawY));
      return [{ x: leftPad + i * xStep, y }];
    });
  };

  const straightPath = (s: RenderSeries) => {
    if (s.values.length === 0) return "";
    const pts = pointsForSeries(s);
    if (pts.length === 0) return "";
    const path = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 1; i < pts.length; i++) {
      path.push(`L ${pts[i].x} ${pts[i].y}`);
    }
    return path.join(" ");
  };

  const smoothPath = (s: RenderSeries) => {
    if (s.values.length === 0) return "";
    const minY = topPad;
    const maxY = topPad + chartH;
    const pts = pointsForSeries(s);
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    const tension = 0.2;
    const path = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
      const cp1yRaw = p1.y + ((p2.y - p0.y) * tension) / 3;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
      const cp2yRaw = p2.y - ((p3.y - p1.y) * tension) / 3;
      const cp1y = Math.min(maxY, Math.max(minY, cp1yRaw));
      const cp2y = Math.min(maxY, Math.max(minY, cp2yRaw));

      path.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
    }
    return path.join(" ");
  };

  const linePath = (s: RenderSeries) => (lineStyle === "straight" ? straightPath(s) : smoothPath(s));

  const areaPath = (s: RenderSeries) => {
    if (s.values.length === 0) return "";
    const pts = pointsForSeries(s);
    if (pts.length === 0) return "";
    const line = linePath(s);
    const startX = pts[0].x;
    const endX = pts[pts.length - 1].x;
    const baseY = topPad + chartH;
    return `${line} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  };

  const updateChartBounds = () => {
    chartContainerRef.current?.measureInWindow((x, _y, measuredWidth) => {
      chartBoundsRef.current = { left: x, width: measuredWidth };
    });
  };
  const getRelativeX = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const relative = event.nativeEvent.pageX - chartBoundsRef.current.left;
    return Number.isFinite(relative) ? relative : event.nativeEvent.locationX;
  };

  const clearTimer = () => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const updateTouchFromX = (rawX: number) => {
    const clamped = Math.min(width - rightPad, Math.max(leftPad, rawX));
    const idx = labels.length > 1 ? Math.round((clamped - leftPad) / xStep) : 0;
    const bounded = Math.max(0, Math.min(labels.length - 1, idx));
    setTouchState({ active: true, x: clamped, index: bounded });
  };
  const deactivateTouch = () => {
    clearTimer();
    pressStartRef.current = null;
    setTouchState((prev) => ({ ...prev, active: false }));
    onTouchActiveChange?.(false);
  };

  const onTouchStart = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    if (touchState.active) return;
    updateChartBounds();
    clearTimer();
    const { pageX, pageY } = event.nativeEvent;
    pressStartRef.current = { pageX, pageY };
    lastXRef.current = getRelativeX(event);
    timerRef.current = setTimeout(() => {
      onTouchActiveChange?.(true);
      updateTouchFromX(lastXRef.current);
    }, LONG_PRESS_DELAY_MS);
  };
  const onTouchMove = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const { pageX, pageY } = event.nativeEvent;
    const relativeX = getRelativeX(event);
    lastXRef.current = relativeX;
    if (touchState.active) {
      updateTouchFromX(relativeX);
      return;
    }
    const start = pressStartRef.current;
    if (!start || !timerRef.current) return;
    if (Math.abs(pageX - start.pageX) > MOVE_CANCEL_THRESHOLD || Math.abs(pageY - start.pageY) > MOVE_CANCEL_THRESHOLD) {
      clearTimer();
      pressStartRef.current = null;
    }
  };
  const onTouchEnd = () => {
    if (!touchState.active) {
      clearTimer();
      pressStartRef.current = null;
      return;
    }
    deactivateTouch();
  };

  const touchRows = touchState.active
    ? visibleSeries
        .map((s) => {
          const hasValue = !(touchState.index < s.startDataIndex || touchState.index > s.lastDataIndex);
          const amount = hasValue ? (s.values[touchState.index] ?? 0) : 0;
          return {
            key: s.key,
            label: s.label,
            color: s.color,
            hasValue,
            amount,
          };
        })
        .filter((row) => (isStraightLineChart ? row.hasValue : row.hasValue && row.amount > 0))
    : [];

  return (
    <View ref={chartContainerRef} onLayout={updateChartBounds}>
      <Svg width={width} height={height} style={{ alignSelf: "center" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        {yTicks.map((r) => {
          const y = topPad + (1 - r) * chartH;
          const tickVal = yMax * r;
          return (
            <G key={`grid-${r}`}>
              <Line x1={leftPad} x2={width - rightPad} y1={y} y2={y} stroke="#232833" strokeDasharray={r === 0 ? "" : "3,3"} strokeWidth={1} />
              <SvgText fill="#8E98AA" fontSize="9" x={leftPad - 6} y={y + 3.5} textAnchor="end">
                {formatCurrencyShort(tickVal, currency)}
              </SvgText>
            </G>
          );
        })}
        {!isStraightLineChart && visibleSeries.map((s) => <Path key={`area-${s.key}`} d={areaPath(s)} fill={s.color} opacity={0.18} />)}
        {visibleSeries.map((s) => (
          <Path key={`line-${s.key}`} d={linePath(s)} fill="none" stroke={s.color} strokeWidth={2.1} />
        ))}
        {isStraightLineChart &&
          visibleSeries.map((s) => pointsForSeries(s).map((point, i) => <Circle key={`pt-${s.key}-${i}`} cx={point.x} cy={point.y} r={1.6} fill={s.color} opacity={0.95} />))}
        {labels.map((label, i) => {
          const shouldShowLabel = labels.length > 12 ? i % 5 === 0 || i === labels.length - 1 : true;
          if (!shouldShowLabel) return null;
          const x = leftPad + i * xStep;
          const y = height - 12;
          return (
            <SvgText key={`x-${label}-${i}`} fill="#8E98AA" fontSize="9" x={x} y={y} textAnchor="middle" transform={verticalXLabels ? `rotate(-90 ${x} ${y})` : undefined}>
              {label}
            </SvgText>
          );
        })}
        {touchState.active && <Line x1={touchState.x} x2={touchState.x} y1={topPad} y2={topPad + chartH} stroke="#667085" strokeDasharray="3,3" strokeWidth={1.2} />}
      </Svg>

      {touchState.active && touchRows.length > 0 && (
        <View className="mt-2 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(8,10,14,0.94)" }}>
          <Text className="text-[11px] font-semibold text-white mb-1">{labels[touchState.index]}</Text>
          {touchRows.map((row) => (
            <View key={`tip-${row.key}`} className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: row.color }} />
                <Text className="text-[11px] text-white">{row.label}</Text>
              </View>
              <Text className="text-[11px] font-semibold text-white">{formatCurrency(row.amount, currency)}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="w-full mt-3 gap-y-2">
        {series.map((s) => {
          const total = s.values.reduce((sum, v) => sum + v, 0);
          const isSelected = selectedSeriesKey === s.key;
          return (
            <Pressable
              key={`legend-${s.key}`}
              onPress={() => setSelectedSeriesKey((prev) => (prev === s.key ? null : s.key))}
              className="flex-row items-center rounded-xl px-2.5 py-2"
              style={{ backgroundColor: isSelected ? "rgba(93,168,255,0.18)" : "rgba(93,168,255,0.1)" }}
            >
              <View className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: s.color }} />
              <Text className="flex-1 text-[12px] font-medium text-slate-700 dark:text-slate-200" numberOfLines={1}>
                {s.label}
              </Text>
              <Text className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 w-24 text-right">{formatCurrency(total, currency)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <View className="items-center py-8">
      <Ionicons name="bar-chart-outline" size={40} color="#8E98AA" />
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
  periodDropdown: {
    position: "absolute",
    top: 44,
    right: 0,
    minWidth: 130,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  periodDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  mixedModeDropdown: {
    position: "absolute",
    top: 42,
    right: 0,
    minWidth: 190,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    zIndex: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryChartModeDropdown: {
    position: "absolute",
    top: 42,
    right: 0,
    minWidth: 130,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    zIndex: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  trendBubbleText: { fontSize: 11, lineHeight: 14, fontWeight: "700", includeFontPadding: false },
  trendBubbleAmountText: { fontSize: 11, lineHeight: 13.5, fontWeight: "700", includeFontPadding: false },
  trendBubblePercentText: { fontSize: 10, lineHeight: 12, fontWeight: "700", includeFontPadding: false },
});

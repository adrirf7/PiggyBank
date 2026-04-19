import DonutChart, { DonutSegment } from "@/components/donut-chart";
import { Colors, PRIMARY } from "@/constants/theme";
import { Category } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/text";

interface BreakdownChartProps {
  incomeSegments: DonutSegment[];
  incomeBreakdown: { category: string; amount: number; percentage: number }[];
  expenseSegments: DonutSegment[];
  expenseBreakdown: { category: string; amount: number; percentage: number }[];
  totalIncome: number;
  totalExpense: number;
  categoriesById: Map<string, Category>;
  currency?: string;
  cardBg: string;
}

type BreakdownMode = "income" | "expense";

export function BreakdownChart({
  incomeSegments,
  incomeBreakdown,
  expenseSegments,
  expenseBreakdown,
  totalIncome,
  totalExpense,
  categoriesById,
  currency,
  cardBg,
}: BreakdownChartProps) {
  const [mode, setMode] = useState<BreakdownMode>("expense");
  const colors = Colors.dark;
  const isDark = true;

  const moneyTextColor = isDark ? "#F8FAFC" : "#0F172A";
  const subtitleColor = isDark ? "#94A3B8" : "#64748B";
  const LONG_PRESS_DELAY_MS = 220;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [morphCategory, setMorphCategory] = useState<string | null>(null);
  const [highlightProgressValue, setHighlightProgressValue] = useState(0);
  const highlightProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastPaintedProgressRef = useRef(0);

  const currentSegments = mode === "expense" ? expenseSegments : incomeSegments;
  const currentBreakdown = mode === "expense" ? expenseBreakdown : incomeBreakdown;
  const currentTotal = mode === "expense" ? totalExpense : totalIncome;

  const activeItem = React.useMemo(() => {
    if (!activeCategory) return null;
    return currentBreakdown.find((item) => item.category === activeCategory) ?? null;
  }, [activeCategory, currentBreakdown]);

  const activeIndex = React.useMemo(() => {
    if (!morphCategory) return -1;
    return currentBreakdown.findIndex((item) => item.category === morphCategory);
  }, [currentBreakdown, morphCategory]);

  const displayCenterLabel = activeItem ? formatCurrency(activeItem.amount, currency) : formatCurrency(currentTotal, currency);
  const displayCenterSubLabel = activeItem ? `${activeItem.percentage.toFixed(1)}%` : `Total ${mode === "expense" ? "gastos" : "ingresos"}`;

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const from = highlightProgressRef.current;
    const to = activeCategory ? 1 : 0;
    const duration = activeCategory ? 300 : 260;
    const startTime = performance.now();

    const step = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 0.5 - Math.cos(t * Math.PI) / 2;
      const value = from + (to - from) * eased;
      highlightProgressRef.current = value;
      if (Math.abs(value - lastPaintedProgressRef.current) > 0.008 || t >= 1) {
        lastPaintedProgressRef.current = value;
        setHighlightProgressValue(value);
      }

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
        if (to === 0) {
          setMorphCategory(null);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [activeCategory]);

  if (incomeBreakdown.length === 0 && expenseBreakdown.length === 0) {
    return null;
  }

  return (
    <View
      className="mx-5 mb-5 rounded-2xl px-4 py-4"
      style={{ backgroundColor: cardBg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
    >
      {/* Header con selector */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Desglose por categoría</Text>

        {/* Selector */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              setMode("expense");
              setActiveCategory(null);
            }}
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: mode === "expense" ? PRIMARY : colors.border }}
          >
            <Text className="text-xs font-semibold" style={{ color: mode === "expense" ? "#000" : colors.text }}>
              Gastos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode("income");
              setActiveCategory(null);
            }}
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: mode === "income" ? PRIMARY : colors.border }}
          >
            <Text className="text-xs font-semibold" style={{ color: mode === "income" ? "#000" : colors.text }}>
              Ingresos
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Donut Chart */}
      <View className="items-center">
        <DonutChart
          data={currentSegments}
          radius={80}
          strokeWidth={24}
          centerLabel={displayCenterLabel}
          centerSubLabel={displayCenterSubLabel}
          centerLabelColor={moneyTextColor}
          centerSubLabelColor={subtitleColor}
          centerBackgroundColor={cardBg}
          morph={activeIndex >= 0 && highlightProgressValue > 0 ? { activeIndex, progress: highlightProgressValue } : null}
        />
      </View>

      {/* Legend */}
      <View className="w-full mt-5 gap-y-2">
        {currentBreakdown.slice(0, 6).map((item) => {
          const cat = categoriesById.get(item.category);
          const isActive = activeCategory === item.category;
          return (
            <Pressable
              key={item.category}
              delayLongPress={LONG_PRESS_DELAY_MS}
              onLongPress={() => {
                setMorphCategory(item.category);
                setActiveCategory(item.category);
              }}
              onPressOut={() => setActiveCategory(null)}
              className="flex-row items-center rounded-xl px-2.5 py-2"
              style={{ backgroundColor: isActive ? "rgba(148,163,184,0.16)" : "rgba(148,163,184,0.08)" }}
            >
              <View className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: cat?.color ?? "#94A3B8" }} />
              <Text className="flex-1 text-[12px] font-medium text-slate-700 dark:text-slate-200" numberOfLines={1}>
                {cat?.name ?? item.category}
              </Text>
              <Text className="text-[11px] font-semibold mr-2 text-slate-600 dark:text-slate-300">{item.percentage.toFixed(1)}%</Text>
              <Text className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 w-24 text-right">{formatCurrency(item.amount, currency)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

import { getCategoryById } from "@/constants/categories";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInRight, SlideOutLeft } from "react-native-reanimated";

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { goals } = useSavingsGoalStore();
  const isIncome = transaction.type === "income";

  // For goal contributions, use the goal's icon and color
  let category = getCategoryById(transaction.category);
  let displayIcon = category?.icon ?? "help-circle-outline";
  let displayColor = category?.color ?? "#64748B";
  let displayName = category?.name ?? "Sin categoría";

  if (transaction.isGoalContribution && transaction.goalId) {
    const goal = goals.find((g) => g.id === transaction.goalId);
    if (goal) {
      displayIcon = goal.icon || "trophy-outline";
      displayColor = goal.color;
      displayName = goal.name;
    }
  }

  return (
    <Animated.View entering={FadeInRight.duration(300)} exiting={SlideOutLeft.duration(250)}>
      <Pressable
        className="flex-row items-center px-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl mb-2.5 active:opacity-70"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.06,
          shadowRadius: 4,
          elevation: isDark ? 0 : 2,
        }}
        onLongPress={onDelete ? () => onDelete(transaction.id) : undefined}
      >
        {/* Category icon bubble */}
        <View className="w-11 h-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: displayColor + "20" }}>
          <Ionicons name={displayIcon as any} size={22} color={displayColor} />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
            {transaction.description || displayName || "Sin descripción"}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{displayName}</Text>
        </View>

        {/* Amount */}
        <Text className="text-sm font-bold" style={{ color: isIncome ? "#22C55E" : "#EF4444" }}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

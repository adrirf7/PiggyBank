import { getCategoryById } from "@/constants/categories";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const category = getCategoryById(transaction.category);
  const isIncome = transaction.type === "income";

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
        <View className="w-11 h-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: (category?.color ?? "#64748B") + "20" }}>
          <Ionicons name={(category?.icon ?? "help-circle-outline") as any} size={22} color={category?.color ?? "#64748B"} />
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
            {transaction.description || category?.name || "Sin descripción"}
          </Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{category?.name ?? "Sin categoría"}</Text>
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

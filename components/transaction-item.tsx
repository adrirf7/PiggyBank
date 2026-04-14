import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/auth";
import { Category, SavingsGoal, Transaction } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInRight, SlideOutLeft, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  animated?: boolean;
  highlightPulse?: boolean;
  goalById?: Map<string, SavingsGoal>;
  categoriesById?: Map<string, Category>;
}

function TransactionItem({ transaction, onDelete, onPress, onLongPress, selectable = false, selected = false, animated = true, highlightPulse = false, goalById, categoriesById }: Props) {
  const colorScheme = useColorScheme();
  const { userProfile } = useAuth();
  const isDark = colorScheme === "dark";
  const isIncome = transaction.type === "income";
  const shakeRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const { displayIcon, displayColor, displayName } = useMemo(() => {
    const category = categoriesById?.get(transaction.category);
    let icon = category?.icon ?? "help-circle-outline";
    let color = category?.color ?? "#64748B";
    let name = category?.name ?? "Sin categoría";

    if (transaction.isGoalContribution && transaction.goalId) {
      const goal = goalById?.get(transaction.goalId);
      if (goal) {
        icon = goal.icon || "trophy-outline";
        color = goal.color;
        name = goal.name;
      }
    }

    return { displayIcon: icon, displayColor: color, displayName: name };
  }, [categoriesById, goalById, transaction.category, transaction.goalId, transaction.isGoalContribution]);

  useEffect(() => {
    if (selectable && selected) {
      shakeRotation.value = withRepeat(withSequence(withTiming(-1.1, { duration: 180 }), withTiming(1.1, { duration: 180 })), -1, true);
      return;
    }
    shakeRotation.value = withTiming(0, { duration: 160 });
  }, [selectable, selected, shakeRotation]);

  useEffect(() => {
    if (!highlightPulse) return;
    pulseScale.value = withSequence(
      withTiming(1.08, { duration: 170 }),
      withTiming(1, { duration: 170 }),
      withTiming(1.08, { duration: 170 }),
      withTiming(1, { duration: 170 }),
    );
  }, [highlightPulse, pulseScale]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${shakeRotation.value}deg` }, { scale: pulseScale.value }],
  }));

  return (
    <Animated.View entering={animated ? FadeInRight.duration(300) : undefined} exiting={animated ? SlideOutLeft.duration(250) : undefined} style={shakeStyle}>
      <Pressable
        className="flex-row items-center px-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl mb-2.5 active:opacity-70"
        style={{
          borderWidth: selectable ? 1.5 : 0,
          borderColor: selected ? "#EF4444" : isDark ? "#334155" : "#E2E8F0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.06,
          shadowRadius: 4,
          elevation: isDark ? 0 : 2,
        }}
        onPress={onPress ? () => onPress(transaction.id) : undefined}
        onLongPress={onLongPress ? () => onLongPress(transaction.id) : onDelete ? () => onDelete(transaction.id) : undefined}
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
          {formatCurrency(transaction.amount, userProfile?.currencyCode)}
        </Text>
        {selectable && (
          <View className="ml-3">
            <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={20} color={selected ? "#EF4444" : isDark ? "#64748B" : "#94A3B8"} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(TransactionItem);

import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { SavingsGoal } from "@/types";
import { formatCurrency } from "@/utils/calculations";

export default function SavingsGoalsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { alert } = useAlert();
  const { userProfile } = useAuth();
  const { goals, deleteGoal } = useSavingsGoalStore();
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const currencyCode = userProfile?.currencyCode;

  const handleDelete = (goal: SavingsGoal) => {
    alert("Eliminar objetivo", `¿Eliminar "${goal.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteGoal(goal.id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Objetivos de ahorro</Text>
        <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: PRIMARY + "20" }} onPress={() => router.push("/add-goal")}>
          <Ionicons name="add" size={22} color={PRIMARY} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
        {goals.length === 0 ? (
          <View className="items-center py-20">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-5" style={{ backgroundColor: PRIMARY + "15" }}>
              <Ionicons name="trophy-outline" size={40} color={PRIMARY} />
            </View>
            <Text className="text-base font-bold text-slate-700 dark:text-slate-200 mb-2">Sin objetivos todavía</Text>
            <Text className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6 leading-5">Crea tu primer objetivo de ahorro{"\n"}y empieza a seguir tu progreso.</Text>
            <Pressable className="px-6 py-3 rounded-2xl" style={{ backgroundColor: PRIMARY }} onPress={() => router.push("/add-goal")}>
              <Text className="text-white font-semibold text-sm">Crear objetivo</Text>
            </Pressable>
          </View>
        ) : (
          goals.map((goal, i) => (
            <Animated.View key={goal.id} entering={FadeInDown.duration(400).delay(i * 60)}>
              <GoalCard
                goal={goal}
                cardBg={cardBg}
                isDark={isDark}
                currencyCode={currencyCode}
                onDelete={() => handleDelete(goal)}
                onPress={() => router.push({ pathname: "/manage-goal", params: { goalId: goal.id } })}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({
  goal,
  cardBg,
  isDark,
  currencyCode,
  onDelete,
  onPress,
}: {
  goal: SavingsGoal;
  cardBg: string;
  isDark: boolean;
  currencyCode?: string;
  onDelete: () => void;
  onPress: () => void;
}) {
  const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const isComplete = percent >= 100;

  return (
    <Pressable className="rounded-2xl mb-4 overflow-hidden" style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress} onLongPress={onDelete}>
      {/* Colored top accent */}
      <View style={{ height: 4, backgroundColor: isComplete ? "#22C55E" : goal.color }} />
      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: (isComplete ? "#22C55E" : goal.color) + "20" }}>
            <Ionicons name={(goal.icon || "trophy-outline") as any} size={20} color={isComplete ? "#22C55E" : goal.color} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>
              {goal.name}
            </Text>
            {goal.targetDate && (
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Objetivo: {format(parseISO(goal.targetDate), "d MMM yyyy", { locale: es })}</Text>
            )}
          </View>
          {isComplete && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#22C55E20" }}>
              <Text className="text-xs font-bold" style={{ color: "#22C55E" }}>
                ✓ Logrado
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}>
          <View className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: isComplete ? "#22C55E" : goal.color }} />
        </View>

        {/* Amounts row */}
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {formatCurrency(goal.currentAmount, currencyCode)} <Text className="text-slate-300 dark:text-slate-600">/ {formatCurrency(goal.targetAmount, currencyCode)}</Text>
          </Text>
          <Text className="text-xs font-bold" style={{ color: isComplete ? "#22C55E" : goal.color }}>
            {percent.toFixed(0)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
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

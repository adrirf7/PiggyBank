import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/constants/theme";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { SavingsGoal, Transaction } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function getRecurrenceLabel(recurrence?: string): string {
  switch (recurrence) {
    case "daily":
      return "Diario";
    case "weekly":
      return "Semanal";
    case "monthly":
      return "Mensual";
    case "quarterly":
      return "Trimestral";
    case "yearly":
      return "Anual";
    default:
      return "Una vez";
  }
}

export default function ManageGoalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { alert } = useAlert();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { goals, deleteGoal } = useSavingsGoalStore();
  const { transactions, deleteGoalContribution } = useTransactionStore();

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);
  
  // Separar transacciones recurrentes y no recurrentes
  const goalTransactions = useMemo(
    () => transactions.filter((t) => t.goalId === goalId && t.isGoalContribution).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, goalId],
  );

  const recurringContributions = useMemo(
    () => goalTransactions.filter((t) => t.recurrence && t.recurrence !== "none"),
    [goalTransactions],
  );

  const nonRecurringTransactions = useMemo(
    () => goalTransactions.filter((t) => !t.recurrence || t.recurrence === "none"),
    [goalTransactions],
  );

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-slate-500">Objetivo no encontrado</Text>
      </SafeAreaView>
    );
  }

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const isComplete = percent >= 100;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const handleDelete = () => {
    alert("Eliminar objetivo", `¿Estás seguro de eliminar "${goal.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteGoal(goal.id);
          router.back();
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push({ pathname: "/add-goal", params: { goalId: goal.id } });
  };

  const handleAddMoney = () => {
    router.push({ pathname: "/add-goal-contribution", params: { goalId: goal.id, type: "add" } });
  };

  const handleRemoveMoney = () => {
    if (goal.currentAmount <= 0) {
      alert("Sin fondos", "Este objetivo no tiene dinero para retirar.");
      return;
    }
    router.push({ pathname: "/add-goal-contribution", params: { goalId: goal.id, type: "remove" } });
  };

  const handleRemoveAll = () => {
    if (goal.currentAmount <= 0) {
      alert("Sin fondos", "Este objetivo no tiene dinero para retirar.");
      return;
    }

    alert("Retirar todo", `¿Estás seguro de retirar todo el dinero (${formatCurrency(goal.currentAmount)}) del objetivo "${goal.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Retirar todo",
        style: "destructive",
        onPress: () => router.push({ pathname: "/add-goal-contribution", params: { goalId: goal.id, type: "remove", amount: goal.currentAmount.toString() } }),
      },
    ]);
  };

  const handleEditRecurringContribution = (transaction: Transaction) => {
    router.push({
      pathname: "/add-goal-contribution",
      params: {
        goalId: goal.id,
        type: transaction.type === "income" ? "add" : "remove",
        transactionId: transaction.id,
        amount: transaction.amount.toString(),
        description: transaction.description,
      },
    });
  };

  const handleDeleteRecurringContribution = (transaction: Transaction) => {
    const recurrenceLabel = getRecurrenceLabel(transaction.recurrence);
    alert("Eliminar aportación recurrente", `¿Eliminar la aportación de ${formatCurrency(transaction.amount)} (${recurrenceLabel})?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoalContribution(transaction.id, transaction);
          } catch (error) {
            alert("Error", "No se pudo eliminar la aportación recurrente.");
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Detalles del objetivo</Text>
        <View className="flex-row gap-2">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={18} color={colors.text} />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Goal Card */}
        <View className="rounded-2xl mb-5 overflow-hidden" style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={{ height: 4, backgroundColor: isComplete ? "#22C55E" : goal.color }} />
          <View className="p-5">
            {/* Icon and name */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: (isComplete ? "#22C55E" : goal.color) + "20" }}>
                <Ionicons name={(goal.icon || "trophy-outline") as any} size={32} color={isComplete ? "#22C55E" : goal.color} />
              </View>
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center">{goal.name}</Text>
              {goal.targetDate && (
                <Text className="text-sm text-slate-400 dark:text-slate-500 mt-1">Fecha objetivo: {format(parseISO(goal.targetDate), "d MMM yyyy", { locale: es })}</Text>
              )}
              {isComplete && (
                <View className="px-3 py-1 rounded-full mt-2" style={{ backgroundColor: "#22C55E20" }}>
                  <Text className="text-sm font-bold" style={{ color: "#22C55E" }}>
                    ✓ Objetivo alcanzado
                  </Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            <View className="h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9" }}>
              <View className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: isComplete ? "#22C55E" : goal.color }} />
            </View>

            {/* Stats */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Progreso</Text>
              <Text className="text-sm font-bold" style={{ color: isComplete ? "#22C55E" : goal.color }}>
                {percent.toFixed(1)}%
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Ahorrado</Text>
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(goal.currentAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Objetivo</Text>
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(goal.targetAmount)}</Text>
            </View>
            {!isComplete && (
              <View className="flex-row justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <Text className="text-sm text-slate-500 dark:text-slate-400">Falta</Text>
                <Text className="text-sm font-bold" style={{ color: goal.color }}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mb-5">
          <View className="flex-row gap-3 mb-3">
            <Pressable
              className="flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: goal.color, ...styles.actionBtn }}
              onPress={handleAddMoney}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text className="text-white font-bold text-sm">Añadir dinero</Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3.5 rounded-2xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: isDark ? "#334155" : "#F1F5F9", ...styles.actionBtn }}
              onPress={handleRemoveMoney}
            >
              <Ionicons name="remove-circle-outline" size={20} color={colors.text} />
              <Text className="font-bold text-sm text-slate-800 dark:text-slate-100">Retirar</Text>
            </Pressable>
          </View>
          {goal.currentAmount > 0 && (
            <Pressable
              className="py-3 rounded-2xl items-center flex-row justify-center gap-2"
              style={{ backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderWidth: 1, borderColor: "#EF4444", ...styles.card }}
              onPress={handleRemoveAll}
            >
              <Ionicons name="cash-outline" size={18} color="#EF4444" />
              <Text className="font-semibold text-sm" style={{ color: "#EF4444" }}>
                Retirar todo ({formatCurrency(goal.currentAmount)})
              </Text>
            </Pressable>
          )}
        </View>

        {/* Recurring Contributions */}
        {recurringContributions.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Aportaciones recurrentes</Text>
            <View className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: cardBg }}>
              {recurringContributions.map((tx, idx) => (
                <RecurringContributionItem
                  key={tx.id}
                  transaction={tx}
                  goal={goal}
                  isDark={isDark}
                  cardBg={cardBg}
                  isFirst={idx === 0}
                  onEdit={handleEditRecurringContribution}
                  onDelete={handleDeleteRecurringContribution}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Transaction History */}
        <View>
          <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Historial de movimientos</Text>
          {nonRecurringTransactions.length === 0 && recurringContributions.length === 0 ? (
            <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: cardBg }}>
              <Ionicons name="file-tray-outline" size={40} color={colors.muted} />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-2">Sin movimientos aún</Text>
            </View>
          ) : nonRecurringTransactions.length === 0 ? (
            <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: cardBg }}>
              <Ionicons name="file-tray-outline" size={40} color={colors.muted} />
              <Text className="text-sm text-slate-400 dark:text-slate-500 mt-2">Sin movimientos puntuales</Text>
            </View>
          ) : (
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg }}>
              {nonRecurringTransactions.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  goal={goal}
                  isDark={isDark}
                  cardBg={cardBg}
                  isFirst={idx === 0}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecurringContributionItem({
  transaction,
  goal,
  isDark,
  cardBg,
  isFirst,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  goal: SavingsGoal;
  isDark: boolean;
  cardBg: string;
  isFirst: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  const isAdd = transaction.type === "income";
  const recurrenceLabel = getRecurrenceLabel(transaction.recurrence);

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={!isFirst ? { borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#F1F5F9" } : {}}
    >
      <Pressable
        className="p-4 flex-row items-center justify-between active:opacity-70"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}
        onPress={() => onEdit(transaction)}
      >
        <View className="flex-1 flex-row items-center">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: goal.color + "20" }}>
            <Ionicons name={goal.icon as any} size={18} color={goal.color} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {isAdd ? "Aportación" : "Retiro"} ({recurrenceLabel})
            </Text>
            <Text className={`text-xs mt-0.5 ${isAdd ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} font-semibold`}>
              {isAdd ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </Text>
            {transaction.description && <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{transaction.description}</Text>}
          </View>
        </View>
        <View className="flex-row items-center gap-2 ml-2">
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: goal.color + "20" }}>
            <Ionicons name="pencil" size={14} color={goal.color} />
          </View>
          <Pressable
            className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
            style={{ backgroundColor: "#EF444420" }}
            onPress={() => onDelete(transaction)}
          >
            <Ionicons name="close" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TransactionItem({
  transaction,
  goal,
  isDark,
  cardBg,
  isFirst,
}: {
  transaction: Transaction;
  goal: SavingsGoal;
  isDark: boolean;
  cardBg: string;
  isFirst: boolean;
}) {
  const isAdd = transaction.type === "income";

  return (
    <View
      className="p-3.5 flex-row items-center"
      style={[!isFirst && { borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#F1F5F9" }, styles.txCard]}
    >
      <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: goal.color + "20" }}>
        <Ionicons name={goal.icon as any} size={18} color={goal.color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">{isAdd ? "Aportación" : "Retiro"}</Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {format(parseISO(transaction.date), "d MMM yyyy", { locale: es })}
        </Text>
        {transaction.description && <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{transaction.description}</Text>}
      </View>
      <Text className="text-sm font-bold" style={{ color: isAdd ? "#22C55E" : "#EF4444" }}>
        {isAdd ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </Text>
    </View>
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
  actionBtn: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  txCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});

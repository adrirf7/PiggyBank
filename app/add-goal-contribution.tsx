import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { RecurrenceType } from "@/types";

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string; icon: string }[] = [
  { key: "none", label: "Una vez", icon: "radio-button-off-outline" },
  { key: "daily", label: "Diario", icon: "sunny-outline" },
  { key: "weekly", label: "Semanal", icon: "calendar-number-outline" },
  { key: "monthly", label: "Mensual", icon: "calendar-outline" },
  { key: "quarterly", label: "Trimestral", icon: "stats-chart-outline" },
  { key: "yearly", label: "Anual", icon: "reload-outline" },
];

export default function AddGoalContributionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { goalId, type: initialType, amount: initialAmount } = useLocalSearchParams<{ goalId: string; type?: "add" | "remove"; amount?: string }>();
  const { goals } = useSavingsGoalStore();
  const { addGoalContribution } = useTransactionStore();

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);

  const [type, setType] = useState<"add" | "remove">(initialType || "add");
  const [amount, setAmount] = useState(initialAmount || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const activeColor = type === "add" ? "#22C55E" : "#EF4444";

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-slate-500">Objetivo no encontrado</Text>
      </SafeAreaView>
    );
  }

  // Calcular el máximo que se puede añadir para completar el objetivo
  const maxAllowed = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    setAmount(cleaned);
  };

  /**
   * Ajusta el monto automáticamente si excede el máximo permitido.
   * Se llama cuando el usuario quita el foco del input.
   */
  const handleAmountBlur = () => {
    if (!amount || type === "remove") return;

    const numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount)) return;

    // Si excede el máximo, ajustarlo automáticamente
    if (numAmount > maxAllowed) {
      setAmount(maxAllowed.toFixed(2));
    }
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }

    let numAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }

    // Si es añadir y excede el máximo, ajustarlo automáticamente
    if (type === "add" && numAmount > maxAllowed) {
      if (maxAllowed === 0) {
        Alert.alert("Objetivo completado", "Este objetivo ya ha alcanzado su meta. No puedes añadir más dinero.");
        return;
      }
      numAmount = maxAllowed;
    }

    // Validar que no se retire más de lo disponible
    if (type === "remove" && numAmount > goal.currentAmount) {
      Alert.alert("Importe excedido", `No puedes retirar más de ${goal.currentAmount.toFixed(2)}€ (cantidad actual en el objetivo).`);
      return;
    }

    try {
      await addGoalContribution({
        goalId: goal.id,
        type: type === "add" ? "income" : "expense",
        amount: numAmount,
        description: description.trim() || (type === "add" ? `Aportación a ${goal.name}` : `Retiro de ${goal.name}`),
        date: format(date, "yyyy-MM-dd"),
        recurrence: recurrence !== "none" ? recurrence : undefined,
      });

      router.back();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la aportación. Inténtalo de nuevo.");
      console.error(error);
    }
  };

  const dateLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Hoy";
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) return "Ayer";
    return format(date, "d MMM yyyy", { locale: es });
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{type === "add" ? "Añadir dinero" : "Retirar dinero"}</Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Goal Preview */}
          <View className="mx-5 mb-5 rounded-2xl p-4 flex-row items-center" style={{ backgroundColor: cardBg, ...styles.card }}>
            <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: goal.color + "20" }}>
              <Ionicons name={(goal.icon || "trophy-outline") as any} size={24} color={goal.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{goal.name}</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Actual: {goal.currentAmount.toFixed(2)}€ / {goal.targetAmount.toFixed(2)}€
              </Text>
            </View>
          </View>

          {/* Add / Remove Toggle */}
          <View className="flex-row mx-5 mb-5 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.buttonSecondary }}>
            {(["add", "remove"] as const).map((t) => (
              <Pressable
                key={t}
                className="flex-1 py-3 items-center justify-center flex-row gap-2"
                style={type === t ? { backgroundColor: t === "add" ? "#22C55E" : "#EF4444" } : {}}
                onPress={() => setType(t)}
              >
                <Ionicons name={t === "add" ? "arrow-down-circle" : "arrow-up-circle"} size={18} color={type === t ? "#fff" : colors.muted} />
                <Text className={`text-sm font-semibold ${type === t ? "text-white" : "text-slate-400 dark:text-slate-500"}`}>{t === "add" ? "Añadir" : "Retirar"}</Text>
              </Pressable>
            ))}
          </View>

          {/* Amount Input */}
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Importe</Text>
              {type === "add" && maxAllowed > 0 && (
                <Text className="text-xs text-slate-400 dark:text-slate-500">
                  Máx: {maxAllowed.toFixed(2)}€
                </Text>
              )}
            </View>
            <View className="rounded-2xl px-4 py-4 flex-row items-center gap-x-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
              <Ionicons name="cash-outline" size={22} color={activeColor} />
              <TextInput
                className="flex-1 text-2xl font-bold text-slate-800 dark:text-slate-100"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={amount}
                onChangeText={handleAmountChange}
                onBlur={handleAmountBlur}
                keyboardType="decimal-pad"
                maxLength={12}
                autoFocus
              />
              <Text className="text-lg font-semibold text-slate-400">€</Text>
            </View>
            {type === "add" && maxAllowed === 0 && (
              <Text className="text-xs text-amber-500 mt-2">⚠️ El objetivo ya está completado</Text>
            )}
          </View>

          {/* Description */}
          <View className="px-5 mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Descripción (opcional)</Text>
            <View className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 text-sm text-slate-800 dark:text-slate-100"
                placeholder="Ej: Ahorro mensual"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Date Selector */}
          <View className="px-5 mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fecha</Text>
            <Pressable
              className="rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
              style={[styles.inputCard, { backgroundColor: cardBg }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center gap-x-3">
                <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                <Text className="text-sm text-slate-800 dark:text-slate-100">{dateLabel()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) setDate(selected);
                }}
              />
            )}
          </View>

          {/* Recurrence (only for add) */}
          {type === "add" && (
            <View className="px-5 mb-5">
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Frecuencia</Text>
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, ...styles.inputCard }}>
                {RECURRENCE_OPTIONS.map((option, idx) => (
                  <Pressable
                    key={option.key}
                    className="px-4 py-3.5 flex-row items-center justify-between"
                    style={idx > 0 ? { borderTopWidth: 1, borderTopColor: isDark ? "#334155" : "#F1F5F9" } : {}}
                    onPress={() => setRecurrence(option.key)}
                  >
                    <View className="flex-row items-center gap-x-3">
                      <Ionicons name={option.icon as any} size={18} color={recurrence === option.key ? activeColor : colors.muted} />
                      <Text className={`text-sm ${recurrence === option.key ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                        {option.label}
                      </Text>
                    </View>
                    {recurrence === option.key && <Ionicons name="checkmark-circle" size={20} color={activeColor} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          <View className="px-5">
            <Pressable
              className="py-4 rounded-2xl items-center"
              style={{
                backgroundColor: type === "add" && maxAllowed === 0 ? colors.muted : activeColor,
                ...styles.saveBtn,
                opacity: type === "add" && maxAllowed === 0 ? 0.5 : 1,
              }}
              onPress={handleSave}
              disabled={type === "add" && maxAllowed === 0}
            >
              <Text className="text-white font-bold text-base">{type === "add" ? "Añadir dinero" : "Retirar dinero"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  inputCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtn: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

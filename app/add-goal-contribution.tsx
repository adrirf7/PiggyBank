import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/text";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { RecurrenceType } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { getCurrencySymbol } from "@/utils/currency";
import { format } from "date-fns";

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string; icon: string }[] = [
  { key: "none", label: "Una vez", icon: "radio-button-off-outline" },
  { key: "daily", label: "Diario", icon: "sunny-outline" },
  { key: "weekly", label: "Semanal", icon: "calendar-number-outline" },
  { key: "monthly", label: "Mensual", icon: "calendar-outline" },
  { key: "quarterly", label: "Trimestral", icon: "stats-chart-outline" },
  { key: "yearly", label: "Anual", icon: "reload-outline" },
];

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AddGoalContributionScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { userProfile } = useAuth();
  const { alert } = useAlert();
  const {
    goalId,
    type: initialType,
    amount: initialAmount,
    transactionId,
    description: initialDescription,
  } = useLocalSearchParams<{
    goalId: string;
    type?: "add" | "remove";
    amount?: string;
    transactionId?: string;
    description?: string;
  }>();
  const { goals } = useSavingsGoalStore();
  const { addGoalContribution, updateGoalContribution, transactions } = useTransactionStore();

  const goal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);
  const editingTransaction = useMemo(() => (transactionId ? transactions.find((t) => t.id === transactionId) : null), [transactionId, transactions]);

  const isEditing = !!transactionId && editingTransaction;

  const [type, setType] = useState<"add" | "remove">(isEditing ? (editingTransaction!.type === "income" ? "add" : "remove") : initialType || "add");
  const [amount, setAmount] = useState(isEditing ? editingTransaction!.amount.toString() : initialAmount || "");
  const [description, setDescription] = useState(isEditing ? editingTransaction!.description || "" : initialDescription || "");
  const [recurrence, setRecurrence] = useState<RecurrenceType>(isEditing ? editingTransaction!.recurrence || "none" : "none");
  const [recurrenceDate, setRecurrenceDate] = useState<Date | null>(
    isEditing && editingTransaction && ["monthly", "quarterly", "yearly"].includes(editingTransaction.recurrence || "") ? new Date(editingTransaction.date) : null,
  );
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<number | null>(isEditing ? (editingTransaction?.recurrenceWeekDay ?? null) : null);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(isEditing ? (editingTransaction?.recurrenceMonthDay ?? null) : null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Sincronizar estado cuando se detecta una transacción para editar
  useEffect(() => {
    if (isEditing && editingTransaction) {
      // Actualizar tipo
      setType(editingTransaction.type === "income" ? "add" : "remove");

      // Actualizar monto
      setAmount(editingTransaction.amount.toString());

      // Actualizar descripción
      setDescription(editingTransaction.description || "");

      // Actualizar frecuencia
      setRecurrence(editingTransaction.recurrence || "none");

      // Actualizar parámetros de frecuencia
      if (editingTransaction.recurrence === "weekly") {
        setSelectedWeekDay(editingTransaction.recurrenceWeekDay ?? null);
      }

      if (editingTransaction.recurrence === "monthly" || editingTransaction.recurrence === "quarterly") {
        setSelectedMonthDay(editingTransaction.recurrenceMonthDay ?? null);
      }

      if (["monthly", "quarterly", "yearly"].includes(editingTransaction.recurrence || "")) {
        setRecurrenceDate(new Date(editingTransaction.date));
      }
    }
  }, [isEditing, editingTransaction]);

  const cardBg = "#1E293B";
  const activeColor = type === "add" ? "#22C55E" : "#EF4444";
  const currencySymbol = getCurrencySymbol(userProfile?.currencyCode ?? "EUR");

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

  const handleRecurrenceChange = (newRecurrence: RecurrenceType) => {
    setRecurrence(newRecurrence);
    setRecurrenceDate(null);
    setSelectedWeekDay(null);
    setSelectedMonthDay(null);

    // Abrir automáticamente el calendario para frecuencias que requieren fecha
    if (["weekly", "monthly", "quarterly", "yearly"].includes(newRecurrence)) {
      setTimeout(() => {
        setShowRecurrencePicker(true);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const getRecurrenceDescription = (): string => {
    switch (recurrence) {
      case "weekly":
        if (selectedWeekDay !== null) {
          return `Ingreso establecido cada ${DAYS_OF_WEEK[selectedWeekDay]}`;
        }
        return "";
      case "monthly":
        if (selectedMonthDay !== null) {
          if (selectedMonthDay === 31) {
            return `Ingreso establecido el último día de cada mes`;
          }
          return `Ingreso establecido el ${selectedMonthDay} de cada mes`;
        }
        return "";
      case "quarterly":
        if (selectedMonthDay !== null) {
          if (selectedMonthDay === 31) {
            return `Ingreso establecido el último día de cada trimestre`;
          }
          return `Ingreso establecido el ${selectedMonthDay} de cada trimestre`;
        }
        return "";
      case "yearly":
        if (recurrenceDate) {
          const day = recurrenceDate.getDate();
          const month = MONTHS[recurrenceDate.getMonth()];
          return `Ingreso establecido el ${day} de ${month} cada año`;
        }
        return "";
      case "daily":
        return "Ingreso establecido diariamente";
      default:
        return "";
    }
  };

  const handleRecurrenceDateSelect = (date: Date) => {
    if (recurrence === "weekly") {
      const dayOfWeek = date.getDay();
      setSelectedWeekDay(dayOfWeek);
    } else if (recurrence === "monthly" || recurrence === "quarterly") {
      const day = date.getDate();
      setSelectedMonthDay(day);
    } else {
      setRecurrenceDate(date);
    }
    setShowRecurrencePicker(false);
  };

  const handleOpenRecurrencePicker = () => {
    setShowRecurrencePicker(true);
    // Desplazar la pantalla suavemente después de que el picker se haya renderizado
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSave = async () => {
    if (!amount) {
      alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }

    let numAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }

    // Si es añadir y excede el máximo (pero no si estamos editando)
    if (!isEditing && type === "add" && numAmount > maxAllowed) {
      if (maxAllowed === 0) {
        alert("Objetivo completado", "Este objetivo ya ha alcanzado su meta. No puedes añadir más dinero.");
        return;
      }
      numAmount = maxAllowed;
    }

    // Validar que no se retire más de lo disponible (pero no si estamos editando)
    if (!isEditing && type === "remove" && numAmount > goal.currentAmount) {
      alert("Importe excedido", `No puedes retirar más de ${formatCurrency(goal.currentAmount)} (cantidad actual en el objetivo).`);
      return;
    }

    try {
      const contributionData = {
        goalId: goal.id,
        accountId: goal.accountId,
        type: type === "add" ? "income" : "expense",
        amount: numAmount,
        description: description.trim() || (type === "add" ? `Aportación a ${goal.name}` : `Retiro de ${goal.name}`),
        date: format(new Date(), "yyyy-MM-dd"),
        recurrence: recurrence !== "none" ? recurrence : undefined,
        ...(recurrence === "weekly" && selectedWeekDay !== null && { recurrenceWeekDay: selectedWeekDay }),
        ...(recurrence === "monthly" && selectedMonthDay !== null && { recurrenceMonthDay: selectedMonthDay }),
        ...(recurrence === "quarterly" && selectedMonthDay !== null && { recurrenceMonthDay: selectedMonthDay }),
      };

      if (isEditing && editingTransaction) {
        await updateGoalContribution(transactionId!, editingTransaction, contributionData);
      } else {
        await addGoalContribution(contributionData);
      }

      router.back();
    } catch (error) {
      alert("Error", `No se pudo ${isEditing ? "actualizar" : "guardar"} la aportación. Inténtalo de nuevo.`);
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isEditing ? `Editar ${type === "add" ? "aportación" : "retiro"}` : type === "add" ? "Añadir dinero" : "Retirar dinero"}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          {/* Goal Preview */}
          <View className="mx-5 mb-5 rounded-2xl p-4 flex-row items-center" style={{ backgroundColor: cardBg, ...styles.card }}>
            <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: goal.color + "20" }}>
              <Ionicons name={(goal.icon || "trophy-outline") as any} size={24} color={goal.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{goal.name}</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Actual: {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
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
              {type === "add" && maxAllowed > 0 && <Text className="text-xs text-slate-400 dark:text-slate-500">Máx: {formatCurrency(maxAllowed)}</Text>}
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
              />
              <Text className="text-lg font-semibold text-slate-400">{currencySymbol}</Text>
            </View>
            {type === "add" && maxAllowed === 0 && <Text className="text-xs text-amber-500 mt-2">⚠️ El objetivo ya está completado</Text>}
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

          {/* Recurrence (only for add) */}
          {type === "add" && (
            <View className="px-5 mb-5">
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Frecuencia</Text>
              <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, ...styles.inputCard }}>
                {RECURRENCE_OPTIONS.map((option, idx) => (
                  <View key={option.key}>
                    <Pressable
                      className="px-4 py-3.5 flex-row items-center justify-between"
                      style={idx > 0 ? { borderTopWidth: 1, borderTopColor: "#334155" } : {}}
                      onPress={() => handleRecurrenceChange(option.key)}
                    >
                      <View className="flex-row items-center gap-x-3 flex-1">
                        <Ionicons name={option.icon as any} size={18} color={recurrence === option.key ? activeColor : colors.muted} />
                        <Text className={`text-sm ${recurrence === option.key ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                          {option.label}
                        </Text>
                      </View>
                      {recurrence === option.key && ["weekly", "monthly", "quarterly", "yearly"].includes(option.key) && (
                        <Pressable
                          className="p-2 rounded-lg active:opacity-70"
                          style={{
                            backgroundColor: activeColor + "15",
                            transform: [{ scale: 1 }],
                          }}
                          onPress={handleOpenRecurrencePicker}
                        >
                          <Ionicons name="calendar-sharp" size={18} color={activeColor} style={{ fontWeight: "bold" }} />
                        </Pressable>
                      )}
                      {recurrence === option.key && <Ionicons name="checkmark-circle" size={20} color={activeColor} />}
                    </Pressable>
                    {recurrence === option.key && getRecurrenceDescription() && (
                      <Text className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-400" style={{ marginTop: -2 }}>
                        {getRecurrenceDescription()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Date Picker for Recurrence */}
              {showRecurrencePicker && recurrence === "weekly" && (
                <Animated.View
                  className="mt-4 rounded-2xl overflow-hidden p-4"
                  style={{ backgroundColor: cardBg, ...styles.inputCard }}
                  entering={FadeInDown.duration(400).springify()}
                  layout={Layout.springify()}
                >
                  <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Selecciona un día</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <Pressable
                        key={idx}
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{
                          backgroundColor: selectedWeekDay === idx ? activeColor : colors.buttonSecondary,
                          minWidth: "22%",
                        }}
                        onPress={() => {
                          setSelectedWeekDay(idx);
                          setShowRecurrencePicker(false);
                        }}
                      >
                        <Text
                          style={{
                            color: selectedWeekDay === idx ? "#fff" : colors.text,
                            fontWeight: selectedWeekDay === idx ? "bold" : "normal",
                          }}
                          className="text-sm"
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {showRecurrencePicker && recurrence === "monthly" && (
                <Animated.View
                  className="mt-4 rounded-2xl overflow-hidden p-4"
                  style={{ backgroundColor: cardBg, ...styles.inputCard }}
                  entering={FadeInDown.duration(400).springify()}
                  layout={Layout.springify()}
                >
                  <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Selecciona un día del mes</Text>
                  <View className="flex-row flex-wrap gap-2 justify-center">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <Pressable
                        key={day}
                        className="py-2 rounded-lg items-center justify-center"
                        style={{
                          backgroundColor: selectedMonthDay === day ? activeColor : colors.buttonSecondary,
                          width: "13%",
                          minHeight: 32,
                        }}
                        onPress={() => {
                          setSelectedMonthDay(day);
                          setShowRecurrencePicker(false);
                        }}
                      >
                        <Text
                          style={{
                            color: selectedMonthDay === day ? "#fff" : colors.text,
                            fontWeight: selectedMonthDay === day ? "bold" : "normal",
                            fontSize: 12,
                          }}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {showRecurrencePicker && recurrence === "quarterly" && (
                <Animated.View
                  className="mt-4 rounded-2xl overflow-hidden p-4"
                  style={{ backgroundColor: cardBg, ...styles.inputCard }}
                  entering={FadeInDown.duration(400).springify()}
                  layout={Layout.springify()}
                >
                  <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Selecciona un día del mes</Text>
                  <View className="flex-row flex-wrap gap-2 justify-center">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <Pressable
                        key={day}
                        className="py-2 rounded-lg items-center justify-center"
                        style={{
                          backgroundColor: selectedMonthDay === day ? activeColor : colors.buttonSecondary,
                          width: "13%",
                          minHeight: 32,
                        }}
                        onPress={() => {
                          setSelectedMonthDay(day);
                          setShowRecurrencePicker(false);
                        }}
                      >
                        <Text
                          style={{
                            color: selectedMonthDay === day ? "#fff" : colors.text,
                            fontWeight: selectedMonthDay === day ? "bold" : "normal",
                            fontSize: 12,
                          }}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {showRecurrencePicker && recurrence === "yearly" && (
                <Animated.View
                  className="mt-4 rounded-2xl overflow-hidden p-4"
                  style={{ backgroundColor: cardBg, ...styles.inputCard }}
                  entering={FadeInDown.duration(400).springify()}
                  layout={Layout.springify()}
                >
                  <DateTimePicker
                    value={recurrenceDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, selected) => {
                      if (selected) {
                        handleRecurrenceDateSelect(selected);
                      }
                    }}
                    locale="es-ES"
                  />
                  {Platform.OS === "ios" && (
                    <Pressable className="mt-3 py-2 rounded-lg items-center" style={{ backgroundColor: activeColor }} onPress={() => setShowRecurrencePicker(false)}>
                      <Text className="text-white font-semibold">Confirmar</Text>
                    </Pressable>
                  )}
                </Animated.View>
              )}
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

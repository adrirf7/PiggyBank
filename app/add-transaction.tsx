import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useCategoriesStore } from "@/store/use-categories";
import { useTransactionStore } from "@/store/use-transactions";
import { Category, RecurrenceType, TransactionType } from "@/types";
import { getCurrencySymbol } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function AddTransactionScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const { alert } = useAlert();
  const { userProfile } = useAuth();
  const { transactions, addTransaction, updateTransaction } = useTransactionStore();
  const { incomeCategories, expenseCategories, allCategories } = useCategoriesStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [recurrenceDate, setRecurrenceDate] = useState<Date | null>(null);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<number | null>(null);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const existingTransaction = transactionId ? transactions.find((tx) => tx.id === transactionId) : undefined;
  const isEditing = !!existingTransaction;
  const resolvedExistingCategoryId = useMemo(() => {
    if (!existingTransaction?.category) return undefined;

    const rawCategory = existingTransaction.category.trim();
    if (!rawCategory) return undefined;

    if (allCategories.some((category) => category.id === rawCategory)) {
      return rawCategory;
    }

    const normalizedRawCategory = rawCategory.toLowerCase();
    const categoryByName = allCategories.find((category) => category.name.toLowerCase() === normalizedRawCategory);
    if (categoryByName) {
      return categoryByName.id;
    }

    const categoryByBaseId = allCategories.find((category) => category.baseCategoryId === rawCategory);
    if (categoryByBaseId) {
      return categoryByBaseId.id;
    }

    return undefined;
  }, [allCategories, existingTransaction]);

  const activeColor = type === "income" ? INCOME_COLOR : EXPENSE_COLOR;
  const categories = type === "income" ? incomeCategories : expenseCategories;
  const cardBg = "#1E293B";
  const currencySymbol = getCurrencySymbol(userProfile?.currencyCode ?? "EUR");

  useEffect(() => {
    if (!existingTransaction) return;

    const resolvedCategory = resolvedExistingCategoryId ? allCategories.find((category) => category.id === resolvedExistingCategoryId) : undefined;
    setType(resolvedCategory?.type ?? existingTransaction.type);
    setAmount(existingTransaction.amount.toString());
    setSelectedCategory(resolvedExistingCategoryId ?? existingTransaction.category);
    setDescription(existingTransaction.description);
    setDate(new Date(existingTransaction.date));
    setRecurrence(existingTransaction.recurrence ?? "none");
    setRecurrenceDate(existingTransaction.recurrence ? new Date(existingTransaction.date) : null);
    setSelectedWeekDay(existingTransaction.recurrenceWeekDay ?? null);
    setSelectedMonthDay(existingTransaction.recurrenceMonthDay ?? null);
    setShowRecurrencePicker(false);
  }, [allCategories, existingTransaction, resolvedExistingCategoryId]);

  const handleAmountChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    setAmount(cleaned);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const numAmount = parseFloat(amount.replace(",", "."));

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }
    if (!selectedCategory) {
      alert("Categoría requerida", "Por favor, selecciona una categoría.");
      return;
    }

    const transactionData = {
      type,
      amount: numAmount,
      category: selectedCategory,
      description: description.trim(),
      date: format(date, "yyyy-MM-dd"),
      createdAt: existingTransaction?.createdAt ?? new Date().toISOString(),
      ...(recurrence !== "none" && { recurrence }),
      ...(recurrence === "weekly" && selectedWeekDay !== null && { recurrenceWeekDay: selectedWeekDay }),
      ...(recurrence === "monthly" && selectedMonthDay !== null && { recurrenceMonthDay: selectedMonthDay }),
      ...(recurrence === "quarterly" && selectedMonthDay !== null && { recurrenceMonthDay: selectedMonthDay }),
    };

    setIsSaving(true);
    router.back();

    const savePromise = isEditing && existingTransaction ? updateTransaction(existingTransaction.id, transactionData) : addTransaction(transactionData);
    void savePromise.catch(() => {
      alert("No se pudo guardar", "Hubo un problema al guardar los cambios. Revisa tu conexión e inténtalo de nuevo.");
    });
  };

  const dateLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Hoy";
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) return "Ayer";
    return format(date, "d MMM yyyy", { locale: es });
  };

  const handleRecurrenceChange = (newRecurrence: RecurrenceType) => {
    setRecurrence(newRecurrence);
    setRecurrenceDate(null);
    setSelectedWeekDay(null);
    setSelectedMonthDay(null);

    if (["weekly", "monthly", "quarterly", "yearly"].includes(newRecurrence)) {
      setTimeout(() => {
        setShowRecurrencePicker(true);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    setShowRecurrencePicker(false);
  };

  const getRecurrenceDescription = (): string => {
    switch (recurrence) {
      case "weekly":
        return selectedWeekDay !== null ? `Transacción establecida cada ${DAYS_OF_WEEK[selectedWeekDay]}` : "";
      case "monthly":
        if (selectedMonthDay === null) return "";
        return selectedMonthDay === 31 ? "Transacción establecida el último día de cada mes" : `Transacción establecida el ${selectedMonthDay} de cada mes`;
      case "quarterly":
        if (selectedMonthDay === null) return "";
        return selectedMonthDay === 31 ? "Transacción establecida el último día de cada trimestre" : `Transacción establecida el ${selectedMonthDay} de cada trimestre`;
      case "yearly":
        if (!recurrenceDate) return "";
        return `Transacción establecida el ${recurrenceDate.getDate()} de ${MONTHS[recurrenceDate.getMonth()]} cada año`;
      case "daily":
        return "Transacción establecida diariamente";
      default:
        return "";
    }
  };

  const handleRecurrenceDateSelect = (selected: Date) => {
    if (recurrence === "weekly") {
      setSelectedWeekDay(selected.getDay());
    } else if (recurrence === "monthly" || recurrence === "quarterly") {
      setSelectedMonthDay(selected.getDate());
    } else {
      setRecurrenceDate(selected);
    }
    setShowRecurrencePicker(false);
  };

  const handleOpenRecurrencePicker = () => {
    setShowRecurrencePicker(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{isEditing ? "Editar transacción" : "Nueva transacción"}</Text>
          <View className="w-10" />
        </View>

        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* ── Income / Expense Toggle ── */}
          <View className="flex-row mx-5 mb-6 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.buttonSecondary }}>
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <Pressable
                key={t}
                className="flex-1 py-3 items-center flex-row justify-center gap-x-2 rounded-2xl"
                style={type === t ? { backgroundColor: activeColor } : undefined}
                onPress={() => {
                  setType(t);
                  setSelectedCategory("");
                }}
              >
                <Ionicons name={t === "income" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"} size={18} color={type === t ? "#fff" : colors.muted} />
                <Text className="text-sm font-semibold" style={{ color: type === t ? "#fff" : colors.muted }}>
                  {t === "income" ? "Ingreso" : "Gasto"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Amount Input ── */}
          <View className="items-center mb-6 px-5">
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Importe</Text>
            <View className="flex-row items-end justify-center">
              <Text className="text-5xl font-extrabold mr-1" style={{ color: activeColor, lineHeight: 56, includeFontPadding: false }}>
                {currencySymbol}
              </Text>
              <TextInput
                className="text-5xl font-extrabold min-w-16 text-center"
                style={{ color: activeColor, lineHeight: 56, paddingVertical: 0 }}
                placeholder="0.00"
                placeholderTextColor={activeColor + "40"}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* ── Category Grid ── */}
          <View className="mx-5 mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Categoría</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3">Puedes gestionar tus categorías en Perfil.</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <CategoryChip key={cat.id} category={cat} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} colors={colors} />
              ))}
            </View>
          </View>

          {/* ── Description & Date ── */}
          <View className="mx-5 gap-y-3">
            {/* Description */}
            <View className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
              <Ionicons name="pencil-outline" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 text-sm"
                style={{ color: colors.text }}
                placeholder="Descripción (opcional)"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                returnKeyType="done"
                maxLength={100}
              />
            </View>

            {/* Date */}
            <Text className="text-xs text-slate-500 dark:text-slate-400 px-1">Establece el día del {type === "income" ? "ingreso" : "gasto"}.</Text>
            <Pressable
              className="rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
              style={[styles.inputCard, { backgroundColor: cardBg }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center gap-x-3">
                <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                <Text className="text-sm" style={{ color: colors.text }}>
                  {dateLabel()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          </View>

          {/* DateTimePicker */}
          {showDatePicker && (
            <>
              {Platform.OS === "ios" ? (
                <View className="mx-5 mt-3 rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg }}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(_, selected) => {
                      if (selected) setDate(selected);
                    }}
                    locale="es-ES"
                  />
                  <Pressable className="mx-4 mb-4 py-3 rounded-xl items-center" style={{ backgroundColor: PRIMARY }} onPress={() => setShowDatePicker(false)}>
                    <Text className="text-white font-semibold text-sm">Confirmar</Text>
                  </Pressable>
                </View>
              ) : (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setDate(selected);
                  }}
                />
              )}
            </>
          )}

          {/* ── Recurrence ── */}
          <View className="mx-5 mt-6 mb-6">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Repetición</Text>
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
                      <Pressable className="p-2 rounded-lg active:opacity-70" style={{ backgroundColor: activeColor + "15" }} onPress={handleOpenRecurrencePicker}>
                        <Ionicons name="calendar-sharp" size={18} color={activeColor} />
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
                      style={{ backgroundColor: selectedWeekDay === idx ? activeColor : colors.buttonSecondary, minWidth: "22%" }}
                      onPress={() => {
                        setSelectedWeekDay(idx);
                        setShowRecurrencePicker(false);
                      }}
                    >
                      <Text className="text-sm" style={{ color: selectedWeekDay === idx ? "#fff" : colors.text, fontWeight: selectedWeekDay === idx ? "bold" : "normal" }}>
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
                      style={{ backgroundColor: selectedMonthDay === day ? activeColor : colors.buttonSecondary, width: "13%", minHeight: 32 }}
                      onPress={() => {
                        setSelectedMonthDay(day);
                        setShowRecurrencePicker(false);
                      }}
                    >
                      <Text style={{ color: selectedMonthDay === day ? "#fff" : colors.text, fontWeight: selectedMonthDay === day ? "bold" : "normal", fontSize: 12 }}>{day}</Text>
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
                      style={{ backgroundColor: selectedMonthDay === day ? activeColor : colors.buttonSecondary, width: "13%", minHeight: 32 }}
                      onPress={() => {
                        setSelectedMonthDay(day);
                        setShowRecurrencePicker(false);
                      }}
                    >
                      <Text style={{ color: selectedMonthDay === day ? "#fff" : colors.text, fontWeight: selectedMonthDay === day ? "bold" : "normal", fontSize: 12 }}>{day}</Text>
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
                  value={recurrenceDate || date}
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

          {/* ── Save button ── */}
          <Pressable className="mx-5 mt-6 py-4 rounded-2xl items-center" style={{ backgroundColor: activeColor, ...styles.saveBtn }} onPress={handleSave}>
            <Text className="text-white font-bold text-base">{isEditing ? "Guardar cambios" : type === "income" ? "Guardar ingreso" : "Guardar gasto"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CategoryChip({ category, selected, onPress, colors }: { category: Category; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-x-1.5 px-3 py-2 rounded-full border"
      style={{
        backgroundColor: selected ? category.color + "20" : "transparent",
        borderColor: selected ? category.color : colors.border,
      }}
    >
      <Ionicons name={category.icon as any} size={15} color={selected ? category.color : colors.muted} />
      <Text className="text-xs font-medium" style={{ color: selected ? category.color : colors.muted }}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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

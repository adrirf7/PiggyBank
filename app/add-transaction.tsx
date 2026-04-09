import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionStore } from "@/store/use-transactions";
import { Category, RecurrenceType, TransactionType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RECURRENCE_OPTIONS: { key: RecurrenceType; label: string; icon: string }[] = [
  { key: "none", label: "Una vez", icon: "radio-button-off-outline" },
  { key: "daily", label: "Diario", icon: "sunny-outline" },
  { key: "weekly", label: "Semanal", icon: "calendar-number-outline" },
  { key: "monthly", label: "Mensual", icon: "calendar-outline" },
  { key: "quarterly", label: "Trimestral", icon: "stats-chart-outline" },
  { key: "yearly", label: "Anual", icon: "reload-outline" },
];

export default function AddTransactionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { alert } = useAlert();
  const { addTransaction } = useTransactionStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");

  const activeColor = type === "income" ? INCOME_COLOR : EXPENSE_COLOR;
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";

  const handleAmountChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    setAmount(cleaned);
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount.replace(",", "."));

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Importe inválido", "Por favor, introduce un importe válido mayor que 0.");
      return;
    }
    if (!selectedCategory) {
      alert("Categoría requerida", "Por favor, selecciona una categoría.");
      return;
    }

    addTransaction({
      type,
      amount: numAmount,
      category: selectedCategory,
      description: description.trim(),
      date: format(date, "yyyy-MM-dd"),
      ...(recurrence !== "none" && { recurrence }),
    });

    router.back();
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
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Nueva transacción</Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
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
            <View className="flex-row items-center">
              <Text className="text-5xl font-extrabold mr-1" style={{ color: activeColor }}>
                €
              </Text>
              <TextInput
                className="text-5xl font-extrabold min-w-16 text-center"
                style={{ color: activeColor }}
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
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Categoría</Text>
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
          <View className="mx-5 mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Repetición</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setRecurrence(opt.key)}
                  className="flex-row items-center px-3 py-2 rounded-full border"
                  style={{
                    backgroundColor: recurrence === opt.key ? activeColor + "20" : "transparent",
                    borderColor: recurrence === opt.key ? activeColor : colors.border,
                  }}
                >
                  <Ionicons name={opt.icon as any} size={13} color={recurrence === opt.key ? activeColor : colors.muted} style={{ marginRight: 4 }} />
                  <Text className="text-xs font-medium" style={{ color: recurrence === opt.key ? activeColor : colors.muted }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Save button ── */}
          <Pressable className="mx-5 mt-6 py-4 rounded-2xl items-center" style={{ backgroundColor: activeColor, ...styles.saveBtn }} onPress={handleSave}>
            <Text className="text-white font-bold text-base">{type === "income" ? "Guardar ingreso" : "Guardar gasto"}</Text>
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

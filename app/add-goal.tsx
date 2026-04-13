import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { getCurrencySymbol } from "@/utils/currency";

const GOAL_ICONS = [
  "trophy-outline",
  "home-outline",
  "car-outline",
  "airplane-outline",
  "school-outline",
  "medkit-outline",
  "gift-outline",
  "phone-portrait-outline",
  "paw-outline",
  "heart-outline",
  "bicycle-outline",
  "camera-outline",
];

const GOAL_COLORS = ["#F97316", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6", "#A855F7", "#0D9488", "#E11D48"];

export default function AddGoalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { userProfile } = useAuth();
  const { alert } = useAlert();
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const { goals, addGoal, updateGoal } = useSavingsGoalStore();
  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const currencySymbol = getCurrencySymbol(userProfile?.currencyCode ?? "EUR");

  const existing = goalId ? goals.find((g) => g.id === goalId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(existing ? existing.targetAmount.toString() : "");
  const [currentAmount, setCurrentAmount] = useState(existing ? existing.currentAmount.toString() : "");
  const [selectedIcon, setSelectedIcon] = useState(existing?.icon ?? "trophy-outline");
  const [selectedColor, setSelectedColor] = useState(existing?.color ?? PRIMARY);
  const [targetDate, setTargetDate] = useState<Date | null>(existing?.targetDate ? parseISO(existing.targetDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = async () => {
    const target = parseFloat(targetAmount.replace(",", "."));
    const current = parseFloat((currentAmount || "0").replace(",", "."));

    if (!name.trim()) {
      alert("Nombre requerido", "Por favor, introduce un nombre para el objetivo.");
      return;
    }
    if (!targetAmount || isNaN(target) || target <= 0) {
      alert("Importe inválido", "Por favor, introduce un importe objetivo válido mayor que 0.");
      return;
    }
    if (isNaN(current) || current < 0) {
      alert("Importe inválido", "El importe ya ahorrado debe ser 0 o mayor.");
      return;
    }

    const data = {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      targetAmount: target,
      currentAmount: current,
      ...(targetDate ? { targetDate: format(targetDate, "yyyy-MM-dd") } : {}),
      createdAt: existing?.createdAt ?? format(new Date(), "yyyy-MM-dd"),
    };

    if (isEditing && existing) {
      await updateGoal(existing.id, data);
    } else {
      await addGoal(data);
    }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{isEditing ? "Editar objetivo" : "Nuevo objetivo"}</Text>
          <View className="w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
          {/* Preview */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-2" style={{ backgroundColor: selectedColor + "20" }}>
              <Ionicons name={selectedIcon as any} size={36} color={selectedColor} />
            </View>
            <Text className="text-base font-bold text-slate-700 dark:text-slate-200">{name || "Mi objetivo"}</Text>
          </View>

          {/* Name */}
          <View className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3 mb-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
            <Ionicons name="pencil-outline" size={18} color={colors.muted} />
            <TextInput
              className="flex-1 text-sm text-slate-800 dark:text-slate-100"
              placeholder="Nombre del objetivo"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          {/* Target Amount */}
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Importe objetivo</Text>
            <View className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
              <Ionicons name="flag-outline" size={18} color={colors.muted} />
                <TextInput
                  className="flex-1 text-sm text-slate-800 dark:text-slate-100"
                  placeholder={`0.00 ${currencySymbol}`}
                placeholderTextColor={colors.muted}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* Current Amount */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {isEditing ? "Importe ahorrado actual" : "Ya tengo ahorrado"}
            </Text>
            <View className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3" style={[styles.inputCard, { backgroundColor: cardBg }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.muted} />
                <TextInput
                  className="flex-1 text-sm text-slate-800 dark:text-slate-100"
                  placeholder={`0.00 ${currencySymbol}`}
                placeholderTextColor={colors.muted}
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* Target Date */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fecha objetivo (opcional)</Text>
            <Pressable
              className="rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
              style={[styles.inputCard, { backgroundColor: cardBg }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center gap-x-3">
                <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                <Text className="text-sm text-slate-800 dark:text-slate-100">{targetDate ? format(targetDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}</Text>
              </View>
              <View className="flex-row items-center gap-x-2">
                {targetDate && (
                  <Pressable onPress={() => setTargetDate(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={targetDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) setTargetDate(selected);
                }}
              />
            )}
          </View>

          {/* Icon Selector */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Icono</Text>
            <View className="flex-row flex-wrap gap-2">
              {GOAL_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: selectedIcon === icon ? selectedColor + "20" : isDark ? "#334155" : "#F1F5F9",
                    borderWidth: selectedIcon === icon ? 2 : 0,
                    borderColor: selectedIcon === icon ? selectedColor : "transparent",
                  }}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons name={icon as any} size={22} color={selectedIcon === icon ? selectedColor : colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color Selector */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Color</Text>
            <View className="flex-row flex-wrap gap-3">
              {GOAL_COLORS.map((color) => (
                <Pressable key={color} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: color }} onPress={() => setSelectedColor(color)}>
                  {selectedColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <Pressable className="py-4 rounded-2xl items-center" style={{ backgroundColor: selectedColor, ...styles.saveBtn }} onPress={handleSave}>
            <Text className="text-white font-bold text-base">{isEditing ? "Guardar cambios" : "Crear objetivo"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

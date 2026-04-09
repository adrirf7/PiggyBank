import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionItem from "@/components/transaction-item";
import { getCategoryById } from "@/constants/categories";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionStore } from "@/store/use-transactions";
import { TransactionType } from "@/types";
import { formatCurrency, groupTransactionsByDate } from "@/utils/calculations";

type Filter = "all" | TransactionType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "income", label: "Ingresos" },
  { key: "expense", label: "Gastos" },
];

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { alert } = useAlert();
  const { transactions, deleteTransaction } = useTransactionStore();
  const searchParams = useLocalSearchParams();
  const [animationCycle, setAnimationCycle] = useState(0);

  const initialFilter = (searchParams.filter as Filter) || "all";
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useFocusEffect(
    useCallback(() => {
      setAnimationCycle((prev) => prev + 1);
    }, [])
  );


  const filtered = useMemo(() => {
    let result = transactions;
    if (filter !== "all") result = result.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const cat = getCategoryById(t.category);
        return t.description.toLowerCase().includes(q) || (cat?.name ?? "").toLowerCase().includes(q);
      });
    }
    return result;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const handleDelete = (id: string) => {
    alert("Eliminar transacción", "¿Estás seguro de que quieres eliminar esta transacción?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <Animated.View key={`tx-header-${animationCycle}`} entering={FadeInDown.duration(400).delay(0)} className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Movimientos</Text>
        <Text className="text-sm text-slate-400 dark:text-slate-500">{transactions.length} transacciones registradas</Text>
      </Animated.View>

      {/* ── Summary strip ── */}
      <Animated.View key={`tx-summary-${animationCycle}`} entering={FadeInDown.duration(400).delay(60)} className="flex-row mx-5 mb-4 gap-x-3">
        <View className="flex-1 flex-row items-center rounded-xl px-3 py-2.5 gap-x-2" style={{ backgroundColor: INCOME_COLOR + "18" }}>
          <Ionicons name="arrow-down-circle" size={18} color={INCOME_COLOR} />
          <View>
            <Text className="text-xs" style={{ color: INCOME_COLOR + "AA" }}>
              Total ingresos
            </Text>
            <Text className="text-sm font-bold" style={{ color: INCOME_COLOR }}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>
        <View className="flex-1 flex-row items-center rounded-xl px-3 py-2.5 gap-x-2" style={{ backgroundColor: EXPENSE_COLOR + "18" }}>
          <Ionicons name="arrow-up-circle" size={18} color={EXPENSE_COLOR} />
          <View>
            <Text className="text-xs" style={{ color: EXPENSE_COLOR + "AA" }}>
              Total gastos
            </Text>
            <Text className="text-sm font-bold" style={{ color: EXPENSE_COLOR }}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Search ── */}
      <Animated.View key={`tx-search-${animationCycle}`} entering={FadeInDown.duration(400).delay(100)} className="mx-5 mb-3 flex-row items-center rounded-xl px-3" style={[styles.searchBox, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          className="flex-1 h-11 text-sm ml-2 text-slate-800 dark:text-slate-100"
          placeholder="Buscar transacciones..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </Animated.View>

      {/* ── Filter chips ── */}
      <Animated.View key={`tx-filters-${animationCycle}`} entering={FadeInDown.duration(400).delay(140)} className="flex-row mx-5 mb-4 gap-x-2">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              className="px-4 py-1.5 rounded-full border"
              style={{
                backgroundColor: active ? PRIMARY : "transparent",
                borderColor: active ? PRIMARY : colors.border,
              }}
            >
              <Text className="text-sm font-medium" style={{ color: active ? "#fff" : colors.muted }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* ── List ── */}
      {grouped.length === 0 ? (
        <Animated.View key={`tx-empty-${animationCycle}`} entering={FadeInDown.duration(400).delay(180)} className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: PRIMARY + "15" }}>
            <Ionicons name={search ? "search-outline" : "document-text-outline"} size={32} color={PRIMARY} />
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
            {search ? "Sin resultados para tu búsqueda" : "No hay transacciones aún.\nUsa el botón + para añadir."}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View key={`tx-list-${animationCycle}`} entering={FadeInDown.duration(400).delay(180)} style={{ flex: 1 }}>
          <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item: group }) => (
            <View>
              {/* Date label */}
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">{group.label}</Text>
              {group.items.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} onDelete={handleDelete} />
              ))}
            </View>
          )}
          />
        </Animated.View>
      )}

      {/* ── FAB ── */}
      <Animated.View key={`tx-fab-${animationCycle}`} entering={FadeInDown.duration(400).delay(220)}>
        <Pressable
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center"
        style={[styles.fab, { backgroundColor: PRIMARY }]}
        onPress={() => router.push("/add-transaction")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionItem from "@/components/transaction-item";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/context/auth";
import { useCategoriesStore } from "@/store/use-categories";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { useTransactionStore } from "@/store/use-transactions";
import { Transaction, TransactionType } from "@/types";
import { formatCurrency, groupTransactionsByDate } from "@/utils/calculations";

type Filter = "all" | TransactionType | "recurring";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "income", label: "Ingresos" },
  { key: "expense", label: "Gastos" },
  { key: "recurring", label: "Recurrentes" },
];

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const { alert } = useAlert();
  const { userProfile } = useAuth();
  const { transactions, deleteTransactions, loading: transactionsLoading } = useTransactionStore();
  const { getCategoryById, allCategories } = useCategoriesStore();
  const { goals, loading: goalsLoading } = useSavingsGoalStore();
  const searchParams = useLocalSearchParams();
  const router = useRouter();
  const isLoadingData = transactionsLoading || goalsLoading;

  const initialFilter = (searchParams.filter as Filter) || "all";
  const focusTransactionId = typeof searchParams.focusTransactionId === "string" ? searchParams.focusTransactionId : null;
  const focusNonce = typeof searchParams.focusNonce === "string" ? searchParams.focusNonce : null;
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const listRef = useRef<FlatList<any>>(null);
  const handledFocusKeyRef = useRef<string | null>(null);
  const [filterSlideDirection, setFilterSlideDirection] = useState<"left" | "right">("left");
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);
  const focusKey = useMemo(
    () => (focusTransactionId ? `${focusTransactionId}:${focusNonce ?? "default"}` : null),
    [focusTransactionId, focusNonce],
  );

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useFocusEffect(
    useCallback(() => {
      const backSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!selectionMode) return false;
        clearSelection();
        return true;
      });

      return () => {
        backSubscription.remove();
      };
    }, [selectionMode, clearSelection]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearSelection();
      };
    }, [clearSelection]),
  );

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }, []),
  );

  const filtered = useMemo(() => {
    if (isLoadingData) return [];
    let result = transactions;
    if (filter === "recurring") {
      result = result.filter((t) => t.recurrence && t.recurrence !== "none");
    } else if (filter !== "all") {
      result = result.filter((t) => t.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const cat = getCategoryById(t.category);
        return t.description.toLowerCase().includes(q) || (cat?.name ?? "").toLowerCase().includes(q);
      });
    }
    return result;
  }, [transactions, filter, search, getCategoryById, isLoadingData]);

  useEffect(() => {
    if (!selectionMode) return;
    const visibleIds = new Set(filtered.map((tx) => tx.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filtered, selectionMode]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);
  const goalById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals]);
  const categoriesById = useMemo(() => new Map(allCategories.map((category) => [category.id, category])), [allCategories]);
  const flatFilteredTransactions = useMemo(() => grouped.flatMap((group) => group.items), [grouped]);
  const dateLabelByDate = useMemo(() => new Map(grouped.map((group) => [group.date, group.label])), [grouped]);

  const selectedTransactions = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const selectedSet = new Set(selectedIds);
    return transactions.filter((tx) => selectedSet.has(tx.id));
  }, [transactions, selectedIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((currentId) => currentId !== id) : [...prev, id];
      if (next.length === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  };

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const exitSelectionMode = () => {
    clearSelection();
  };

  const handleEditTransaction = (id: string) => {
    router.push({ pathname: "/add-transaction", params: { transactionId: id } });
  };

  const handleDeleteSelected = () => {
    if (selectedTransactions.length === 0) return;
    const amountText = selectedTransactions.length === 1 ? "1 transacción" : `${selectedTransactions.length} transacciones`;
    alert("Eliminar transacciones", `¿Seguro que quieres eliminar ${amountText}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTransactions(selectedTransactions);
          exitSelectionMode();
        },
      },
    ]);
  };

  const totalIncome = useMemo(() => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);
  const recurringIncome = useMemo(
    () => transactions.filter((t) => t.type === "income" && t.recurrence && t.recurrence !== "none").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const recurringExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense" && t.recurrence && t.recurrence !== "none").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const recurringCount = useMemo(() => transactions.filter((t) => t.recurrence && t.recurrence !== "none").length, [transactions]);

  const renderTransaction = useCallback(
    ({ item: tx, index }: { item: Transaction; index: number }) => {
      const currentDate = tx.date.slice(0, 10);
      const previousDate = index > 0 ? flatFilteredTransactions[index - 1].date.slice(0, 10) : null;
      const shouldShowDateHeader = currentDate !== previousDate;
      const dateLabel = dateLabelByDate.get(currentDate) ?? "";

      return (
        <View>
          {shouldShowDateHeader && dateLabel.length > 0 && (
            <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4">{dateLabel}</Text>
          )}
          <TransactionItem
            transaction={tx}
            goalById={goalById}
            categoriesById={categoriesById}
            selectable={selectionMode}
            selected={selectedIdSet.has(tx.id)}
            onPress={selectionMode ? toggleSelected : handleEditTransaction}
            onLongPress={enterSelectionMode}
            animated={false}
            highlightPulse={highlightedTransactionId === tx.id}
          />
        </View>
      );
    },
    [
      flatFilteredTransactions,
      dateLabelByDate,
      goalById,
      categoriesById,
      selectionMode,
      selectedIdSet,
      highlightedTransactionId,
    ],
  );

  useEffect(() => {
    if (!focusTransactionId || !focusKey) {
      setHighlightedTransactionId(null);
      handledFocusKeyRef.current = null;
      return;
    }
    if (handledFocusKeyRef.current === focusKey) {
      return;
    }

    const index = flatFilteredTransactions.findIndex((tx) => tx.id === focusTransactionId);
    if (index < 0) {
      return;
    }

    handledFocusKeyRef.current = focusKey;
    requestAnimationFrame(() => {
      setHighlightedTransactionId(null);
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
      requestAnimationFrame(() => {
        setHighlightedTransactionId(focusTransactionId);
      });
    });
  }, [focusKey, focusTransactionId, flatFilteredTransactions]);

  useEffect(() => {
    if (!highlightedTransactionId) return;
    const timeout = setTimeout(() => {
      setHighlightedTransactionId((current) => (current === highlightedTransactionId ? null : current));
    }, 900);
    return () => clearTimeout(timeout);
  }, [highlightedTransactionId]);

  return (
    <SafeAreaView className="flex-1" style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(0)} className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-100">Movimientos</Text>
          {selectionMode && (
            <Pressable onPress={exitSelectionMode} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? "#334155" : "#E2E8F0" }}>
              <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cancelar</Text>
            </Pressable>
          )}
        </View>
        <Text className="text-sm text-slate-400 dark:text-slate-500">
          {selectionMode
            ? `${selectedIds.length} seleccionada${selectedIds.length === 1 ? "" : "s"} · Mantén pulsado para seleccionar`
            : `${transactions.length} transacciones registradas · ${recurringCount} recurrentes · Mantén pulsado para seleccionar`}
        </Text>
      </Animated.View>

      {/* ── Summary strip ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(60)} className="flex-row mx-5 mb-4 gap-x-3">
        <View className="flex-1 flex-row items-center rounded-xl px-3 py-2.5 gap-x-2" style={{ backgroundColor: INCOME_COLOR + "18" }}>
          <Ionicons name="arrow-down-circle" size={18} color={INCOME_COLOR} />
          <View>
            <Text className="text-xs" style={{ color: INCOME_COLOR + "AA" }}>
              Total ingresos
            </Text>
            <Text className="text-sm font-bold" style={{ color: INCOME_COLOR }}>
              {formatCurrency(totalIncome, userProfile?.currencyCode)}
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
              {formatCurrency(totalExpense, userProfile?.currencyCode)}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(80)} className="flex-row mx-5 mb-4 gap-x-3">
        <View className="flex-1 flex-row items-center rounded-xl px-3 py-2.5 gap-x-2" style={{ backgroundColor: INCOME_COLOR + "10" }}>
          <Ionicons name="repeat-outline" size={16} color={INCOME_COLOR} />
          <View>
            <Text className="text-xs" style={{ color: INCOME_COLOR + "CC" }}>
              Ingresos recurrentes
            </Text>
            <Text className="text-sm font-bold" style={{ color: INCOME_COLOR }}>
              {formatCurrency(recurringIncome, userProfile?.currencyCode)}
            </Text>
          </View>
        </View>
        <View className="flex-1 flex-row items-center rounded-xl px-3 py-2.5 gap-x-2" style={{ backgroundColor: EXPENSE_COLOR + "10" }}>
          <Ionicons name="repeat-outline" size={16} color={EXPENSE_COLOR} />
          <View>
            <Text className="text-xs" style={{ color: EXPENSE_COLOR + "CC" }}>
              Gastos recurrentes
            </Text>
            <Text className="text-sm font-bold" style={{ color: EXPENSE_COLOR }}>
              {formatCurrency(recurringExpense, userProfile?.currencyCode)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Search ── */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} className="mx-5 mb-3 flex-row items-center rounded-xl px-3" style={[styles.searchBox, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
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
      <Animated.View entering={FadeInDown.duration(400).delay(140)} className="flex-row flex-wrap mx-5 mb-4 gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                if (key === filter) return;
                const currentIndex = FILTERS.findIndex((item) => item.key === filter);
                const nextIndex = FILTERS.findIndex((item) => item.key === key);
                setFilterSlideDirection(nextIndex > currentIndex ? "left" : "right");
                setFilter(key);
              }}
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
      {isLoadingData ? (
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3">Cargando transacciones...</Text>
        </View>
      ) : grouped.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(400).delay(180)} className="flex-1 items-center justify-center">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: PRIMARY + "15" }}>
            <Ionicons name={search ? "search-outline" : "document-text-outline"} size={32} color={PRIMARY} />
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
            {search ? "Sin resultados para tu búsqueda" : "No hay transacciones aún.\nUsa el botón + para añadir."}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View
          key={`${filter}-${search.trim() ? "search" : "no-search"}`}
          entering={(filterSlideDirection === "left" ? SlideInRight : SlideInLeft).duration(220)}
          exiting={(filterSlideDirection === "left" ? SlideOutLeft : SlideOutRight).duration(220)}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={listRef}
            data={flatFilteredTransactions}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            onScrollToIndexFailed={(info) => {
              const fallbackOffset = Math.max(0, info.averageItemLength * info.index);
              listRef.current?.scrollToOffset({ offset: fallbackOffset, animated: true });
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              }, 180);
            }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={renderTransaction}
          />
        </Animated.View>
      )}

      {/* ── FAB ── */}
      {selectionMode && (
        <Animated.View entering={FadeInDown.duration(400).delay(220)}>
          <Pressable
            className="absolute bottom-8 left-6 right-6 rounded-2xl py-4 items-center justify-center"
            style={[styles.fab, { backgroundColor: selectedIds.length > 0 ? "#EF4444" : isDark ? "#334155" : "#CBD5E1" }]}
            disabled={selectedIds.length === 0}
            onPress={handleDeleteSelected}
          >
            <Text className="text-white font-bold text-sm">Eliminar seleccionadas ({selectedIds.length})</Text>
          </Pressable>
        </Animated.View>
      )}

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

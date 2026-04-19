import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useSavingsGoalStore } from "@/store/use-savings-goals";
import { SavingsGoal } from "@/types";
import { formatCurrency } from "@/utils/calculations";

// Approximate height of one goal card + its bottom margin (used for drag position math)
const ITEM_H = 120;

// ── Draggable goals list ──────────────────────────────────────────────────────
interface DraggableListProps {
  goals: SavingsGoal[];
  onReorder: (reordered: SavingsGoal[]) => void;
  currencyCode?: string;
  onDelete: (goal: SavingsGoal) => void;
  onPress: (goalId: string) => void;
}

function DraggableGoalsList({ goals, onReorder, currencyCode, onDelete, onPress }: DraggableListProps) {
  const [items, setItems] = useState<SavingsGoal[]>(goals);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setItems(goals);
  }, [goals]);

  const dragFrom = useSharedValue(-1);
  const dragDY = useSharedValue(0);

  const startDrag = useCallback(() => setIsDragging(true), []);

  const commitDrag = useCallback(
    (from: number, to: number) => {
      setIsDragging(false);
      dragFrom.value = -1;
      dragDY.value = 0;

      if (from === to) return;
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onReorder(next);
        return next;
      });
    },
    [dragFrom, dragDY, onReorder],
  );

  return (
    <ScrollView
      scrollEnabled={!isDragging}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
    >
      {items.length === 0 ? (
        <EmptyGoals />
      ) : (
        items.map((goal, idx) => (
          <DraggableGoalItem
            key={goal.id}
            goal={goal}
            listIndex={idx}
            totalItems={items.length}
            dragFrom={dragFrom}
            dragDY={dragDY}
            onDragStart={startDrag}
            onDragEnd={commitDrag}
            currencyCode={currencyCode}
            onDelete={onDelete}
            onPress={onPress}
          />
        ))
      )}
    </ScrollView>
  );
}

// ── Single draggable item ─────────────────────────────────────────────────────
interface DraggableItemProps {
  goal: SavingsGoal;
  listIndex: number;
  totalItems: number;
  dragFrom: ReturnType<typeof useSharedValue<number>>;
  dragDY: ReturnType<typeof useSharedValue<number>>;
  onDragStart: () => void;
  onDragEnd: (from: number, to: number) => void;
  currencyCode?: string;
  onDelete: (goal: SavingsGoal) => void;
  onPress: (goalId: string) => void;
}

function DraggableGoalItem({
  goal,
  listIndex,
  totalItems,
  dragFrom,
  dragDY,
  onDragStart,
  onDragEnd,
  currencyCode,
  onDelete,
  onPress,
}: DraggableItemProps) {
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(280)
    .onStart(() => {
      dragFrom.value = listIndex;
      dragDY.value = 0;
      onDragStart();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      dragDY.value = e.translationY;
    })
    .onEnd(() => {
      const from = dragFrom.value;
      const to = Math.max(0, Math.min(totalItems - 1, Math.round(from + dragDY.value / ITEM_H)));
      onDragEnd(from, to);
    });

  const animStyle = useAnimatedStyle(() => {
    const isDragged = dragFrom.value === listIndex;

    if (isDragged) {
      return {
        transform: [{ translateY: dragDY.value }, { scale: 1.035 }],
        zIndex: 999,
        elevation: 18,
        shadowOpacity: 0.32,
      };
    }

    if (dragFrom.value === -1) {
      return { zIndex: 1 };
    }

    const from = dragFrom.value;
    const to = Math.max(0, Math.min(totalItems - 1, Math.round(from + dragDY.value / ITEM_H)));
    let shift = 0;
    if (from < to && listIndex > from && listIndex <= to) shift = -ITEM_H;
    else if (from > to && listIndex < from && listIndex >= to) shift = ITEM_H;

    return { transform: [{ translateY: shift }], zIndex: 1 };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ marginBottom: 12 }, animStyle]}>
        <GoalCard
          goal={goal}
          currencyCode={currencyCode}
          onDelete={() => onDelete(goal)}
          onPress={() => onPress(goal.id)}
          isDraggable
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Goal card ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  currencyCode,
  onDelete,
  onPress,
  isDraggable,
}: {
  goal: SavingsGoal;
  currencyCode?: string;
  onDelete: () => void;
  onPress: () => void;
  isDraggable?: boolean;
}) {
  const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const isComplete = percent >= 100;
  const accentColor = isComplete ? "#22C55E" : goal.color;

  return (
    <Pressable style={[styles.card, { borderLeftColor: accentColor }]} onPress={onPress} onLongPress={onDelete}>
      <View style={{ height: 3, backgroundColor: accentColor, borderRadius: 2, marginBottom: 14 }} />

      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: accentColor + "20" }]}>
          <Ionicons name={(goal.icon || "trophy-outline") as any} size={20} color={accentColor} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {goal.name}
          </Text>
          {goal.targetDate && (
            <Text style={styles.cardDate}>
              Objetivo: {format(parseISO(goal.targetDate), "d MMM yyyy", { locale: es })}
            </Text>
          )}
        </View>

        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>✓ Logrado</Text>
          </View>
        ) : isDraggable ? (
          <Ionicons name="reorder-three-outline" size={22} color="rgba(255,255,255,0.25)" />
        ) : null}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: accentColor }]} />
      </View>

      {/* Amounts */}
      <View style={styles.amountsRow}>
        <Text style={styles.amountCurrent}>
          {formatCurrency(goal.currentAmount, currencyCode)}
          <Text style={styles.amountSeparator}> / {formatCurrency(goal.targetAmount, currencyCode)}</Text>
        </Text>
        <Text style={[styles.amountPercent, { color: accentColor }]}>{percent.toFixed(0)}%</Text>
      </View>
    </Pressable>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyGoals() {
  const router = useRouter();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: PRIMARY + "15" }]}>
        <Ionicons name="trophy-outline" size={40} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>Sin objetivos todavía</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primer objetivo de ahorro{"\n"}y empieza a seguir tu progreso.
      </Text>
      <Pressable style={[styles.emptyBtn, { backgroundColor: PRIMARY }]} onPress={() => router.push("/add-goal")}>
        <Text style={styles.emptyBtnText}>Crear objetivo</Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SavingsGoalsScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { alert } = useAlert();
  const { userProfile } = useAuth();
  const { goals, deleteGoal, reorderGoals, loading } = useSavingsGoalStore();
  const currencyCode = userProfile?.currencyCode;

  const handleDelete = useCallback(
    (goal: SavingsGoal) => {
      alert("Eliminar objetivo", `¿Eliminar "${goal.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteGoal(goal.id) },
      ]);
    },
    [alert, deleteGoal],
  );

  const handleReorder = useCallback(
    (reordered: SavingsGoal[]) => {
      reorderGoals(reordered);
    },
    [reorderGoals],
  );

  const handlePress = useCallback(
    (goalId: string) => {
      router.push({ pathname: "/manage-goal", params: { goalId } });
    },
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable style={[styles.headerBtn, { backgroundColor: colors.buttonSecondary }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Objetivos de ahorro</Text>
          {goals.length > 1 && (
            <Text style={styles.headerHint}>Mantén pulsado para reordenar</Text>
          )}
        </View>
        <Pressable style={[styles.headerBtn, { backgroundColor: PRIMARY + "20" }]} onPress={() => router.push("/add-goal")}>
          <Ionicons name="add" size={22} color={PRIMARY} />
        </Pressable>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando objetivos...</Text>
        </View>
      ) : (
        <DraggableGoalsList
          goals={goals}
          onReorder={handleReorder}
          currencyCode={currencyCode}
          onDelete={handleDelete}
          onPress={handlePress}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerHint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#111318",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E2128",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
    marginTop: 2,
  },
  completeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#22C55E20",
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22C55E",
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1E2530",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  amountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountCurrent: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  amountSeparator: {
    color: "rgba(255,255,255,0.28)",
    fontWeight: "400",
  },
  amountPercent: {
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

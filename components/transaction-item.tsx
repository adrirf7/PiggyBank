import { CategoryIcon } from "@/components/category-icon";
import { Text } from "@/components/text";
import { Colors, EXPENSE_COLOR, INCOME_COLOR } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { Category, SavingsGoal, Transaction } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  animated?: boolean;
  highlightPulse?: boolean;
  goalById?: Map<string, SavingsGoal>;
  categoriesById?: Map<string, Category>;
}

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getRecurrenceLabel(transaction: Transaction): string {
  switch (transaction.recurrence) {
    case "daily":
      return "Diario";
    case "weekly": {
      const day = transaction.recurrenceWeekDay != null ? WEEK_DAYS[transaction.recurrenceWeekDay] : null;
      return day ? `Semanal · ${day}` : "Semanal";
    }
    case "monthly": {
      const d = transaction.recurrenceMonthDay;
      return d != null ? `Mensual · día ${d}` : "Mensual";
    }
    case "quarterly": {
      const d = transaction.recurrenceMonthDay;
      return d != null ? `Trimestral · día ${d}` : "Trimestral";
    }
    case "yearly":
      return "Anual";
    default:
      return "";
  }
}

function TransactionItem({
  transaction,
  onDelete,
  onPress,
  onLongPress,
  selectable = false,
  selected = false,
  animated = true,
  highlightPulse = false,
  goalById,
  categoriesById,
}: Props) {
  const { userProfile } = useAuth();
  const isIncome = transaction.type === "income";
  const recurrenceLabel = getRecurrenceLabel(transaction);
  const shakeRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const { displayIcon, displayColor, displayName } = useMemo(() => {
    const category = categoriesById?.get(transaction.category);
    let icon = category?.icon ?? "help-circle-outline";
    let color = category?.color ?? "#64748B";
    let name = category?.name ?? "Sin categoría";

    if (transaction.isGoalContribution && transaction.goalId) {
      const goal = goalById?.get(transaction.goalId);
      if (goal) {
        icon = goal.icon || "trophy-outline";
        color = goal.color;
        name = goal.name;
      }
    }

    return { displayIcon: icon, displayColor: color, displayName: name };
  }, [categoriesById, goalById, transaction.category, transaction.goalId, transaction.isGoalContribution]);

  const timeStr = useMemo(() => {
    try {
      const source = transaction.createdAt ?? transaction.date + "T12:00:00";
      return new Date(source).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [transaction.createdAt, transaction.date]);

  useEffect(() => {
    if (selectable && selected) {
      shakeRotation.value = withRepeat(
        withSequence(withTiming(-1.1, { duration: 180 }), withTiming(1.1, { duration: 180 })),
        -1,
        true,
      );
      return;
    }
    shakeRotation.value = withTiming(0, { duration: 160 });
  }, [selectable, selected, shakeRotation]);

  useEffect(() => {
    if (!highlightPulse) return;
    pulseScale.value = withSequence(
      withTiming(1.08, { duration: 170 }),
      withTiming(1, { duration: 170 }),
      withTiming(1.08, { duration: 170 }),
      withTiming(1, { duration: 170 }),
    );
  }, [highlightPulse, pulseScale]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${shakeRotation.value}deg` }, { scale: pulseScale.value }],
  }));

  const amountColor = isIncome ? INCOME_COLOR : EXPENSE_COLOR;

  return (
    <Animated.View
      entering={animated ? FadeInRight.duration(300) : undefined}
      exiting={animated ? SlideOutLeft.duration(250) : undefined}
      style={shakeStyle}
    >
      <Pressable
        style={[
          styles.card,
          selectable
            ? { borderColor: selected ? EXPENSE_COLOR : "rgba(255,255,255,0.10)", borderWidth: 1.5 }
            : styles.cardBorder,
        ]}
        onPress={onPress ? () => onPress(transaction.id) : undefined}
        onLongPress={
          onLongPress
            ? () => onLongPress(transaction.id)
            : onDelete
              ? () => onDelete(transaction.id)
              : undefined
        }
      >
        {/* Left accent stripe */}
        <View style={[styles.leftStripe, { backgroundColor: displayColor }]} pointerEvents="none" />

        {/* Category icon */}
        <View style={styles.iconBubble}>
          <CategoryIcon icon={displayIcon} size={22} color={displayColor} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {transaction.description || displayName}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {displayName}{timeStr ? ` · ${timeStr}` : ""}
          </Text>
          {!!recurrenceLabel && (
            <View style={[styles.recurrencePill, { backgroundColor: amountColor + "1A" }]}>
              <Ionicons name="repeat-outline" size={10} color={amountColor} />
              <Text style={[styles.recurrenceText, { color: amountColor }]}>{recurrenceLabel}</Text>
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, userProfile?.currencyCode)}
          </Text>
          <Text style={styles.amountType}>{isIncome ? "Ingreso" : "Gasto"}</Text>
        </View>

        {selectable && (
          <View style={styles.selectionIcon}>
            <Ionicons
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={selected ? EXPENSE_COLOR : Colors.dark.tabIconDefault}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#181a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardBorder: {},
  leftStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconBubble: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  sub: {
    fontSize: 11,
    color: "#666070",
    fontWeight: "500",
  },
  recurrencePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 3,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: "600",
  },
  amountSection: {
    alignItems: "flex-end",
    gap: 2,
    marginLeft: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  amountType: {
    fontSize: 10,
    color: "#404055",
    fontWeight: "500",
  },
  selectionIcon: {
    marginLeft: 10,
  },
});

export default React.memo(TransactionItem);

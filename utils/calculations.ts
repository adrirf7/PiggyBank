import { Period, Transaction } from "@/types";
import { getCurrentCurrencyCode } from "@/utils/currency";
import {
    addDays,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    getDaysInMonth,
    isWithinInterval,
    parseISO,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subMonths,
    subWeeks,
    subYears,
} from "date-fns";
import { es } from "date-fns/locale";

export function filterByPeriod(transactions: Transaction[], period: Period, referenceDate: Date = new Date()): Transaction[] {
  const now = referenceDate;
  let start: Date;
  let end: Date;

  switch (period) {
    case "week":
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "year":
      start = startOfYear(now);
      end = endOfYear(now);
      break;
  }

  return transactions.filter((t) => {
    const date = parseISO(t.date);
    return isWithinInterval(date, { start, end });
  });
}

export function filterByPreviousPeriod(transactions: Transaction[], period: Period, referenceDate: Date = new Date()): Transaction[] {
  const now = referenceDate;
  let start: Date;
  let end: Date;

  switch (period) {
    case "week": {
      const prevWeekEnd = startOfWeek(now, { weekStartsOn: 1 });
      const prevWeekStart = subWeeks(prevWeekEnd, 1);
      start = prevWeekStart;
      end = prevWeekEnd;
      break;
    }
    case "month": {
      const prevMonth = subMonths(now, 1);
      start = startOfMonth(prevMonth);
      end = endOfMonth(prevMonth);
      break;
    }
    case "year": {
      const prevYear = subYears(now, 1);
      start = startOfYear(prevYear);
      end = endOfYear(prevYear);
      break;
    }
  }

  return transactions.filter((t) => {
    const date = parseISO(t.date);
    return isWithinInterval(date, { start, end });
  });
}

export function aggregatePeriodTotals(
  transactions: Transaction[],
  period: Period,
  referenceDate: Date = new Date(),
): { currentIncome: number; currentExpense: number; previousIncome: number; previousExpense: number } {
  const now = referenceDate;
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (period) {
    case "week": {
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      currentEnd = endOfWeek(now, { weekStartsOn: 1 });
      const prevWeekEnd = currentStart;
      previousStart = subWeeks(prevWeekEnd, 1);
      previousEnd = prevWeekEnd;
      break;
    }
    case "month": {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      const prevMonth = subMonths(now, 1);
      previousStart = startOfMonth(prevMonth);
      previousEnd = endOfMonth(prevMonth);
      break;
    }
    case "year": {
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      const prevYear = subYears(now, 1);
      previousStart = startOfYear(prevYear);
      previousEnd = endOfYear(prevYear);
      break;
    }
  }

  let currentIncome = 0;
  let currentExpense = 0;
  let previousIncome = 0;
  let previousExpense = 0;

  for (const transaction of transactions) {
    if (transaction.isGoalContribution) continue;
    const date = parseISO(transaction.date);
    const inCurrent = isWithinInterval(date, { start: currentStart, end: currentEnd });
    const inPrevious = isWithinInterval(date, { start: previousStart, end: previousEnd });

    if (inCurrent) {
      if (transaction.type === "income") currentIncome += transaction.amount;
      if (transaction.type === "expense") currentExpense += transaction.amount;
    }
    if (inPrevious) {
      if (transaction.type === "income") previousIncome += transaction.amount;
      if (transaction.type === "expense") previousExpense += transaction.amount;
    }
  }

  return { currentIncome, currentExpense, previousIncome, previousExpense };
}

export interface PercentageChange {
  percentage: number;
  isPositive: boolean;
}

export function calculatePercentageChange(current: number, previous: number): PercentageChange {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      isPositive: current > 0,
    };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    isPositive: change >= 0,
  };
}

export function getTotalByType(transactions: Transaction[], type: "income" | "expense"): number {
  // Excluir transacciones de objetivos de ahorro
  return transactions.filter((t) => t.type === type && !t.isGoalContribution).reduce((sum, t) => sum + t.amount, 0);
}

export function getBalance(transactions: Transaction[]): number {
  // Balance = ingresos - gastos (sin incluir aportaciones a objetivos)
  const normalIncome = getTotalByType(transactions, "income");
  const normalExpense = getTotalByType(transactions, "expense");

  // El dinero aportado a objetivos sale del saldo disponible
  const goalContributions = transactions.filter((t) => t.isGoalContribution && t.type === "income").reduce((sum, t) => sum + t.amount, 0);

  // El dinero retirado de objetivos vuelve al saldo disponible
  const goalWithdrawals = transactions.filter((t) => t.isGoalContribution && t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return normalIncome - normalExpense - goalContributions + goalWithdrawals;
}

/**
 * Calcula el total de dinero ahorrado en objetivos de ahorro.
 * Suma las aportaciones (income) y resta los retiros (expense) de objetivos.
 */
export function getTotalSaved(transactions: Transaction[]): number {
  const goalTransactions = transactions.filter((t) => t.isGoalContribution);
  const saved = goalTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const withdrawn = goalTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  return saved - withdrawn;
}

export function getCategoryBreakdown(transactions: Transaction[], type: "income" | "expense"): { category: string; amount: number; percentage: number }[] {
  // Excluir transacciones de objetivos de ahorro
  const filtered = transactions.filter((t) => t.type === type && !t.isGoalContribution);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const breakdown: Record<string, number> = {};
  filtered.forEach((t) => {
    breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
  });

  return Object.entries(breakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthlyData {
  label: string;
  income: number;
  expense: number;
}

export function getMonthlyData(transactions: Transaction[], months = 6): MonthlyData[] {
  const now = new Date();
  const monthBuckets = new Map<string, { income: number; expense: number }>();

  for (const transaction of transactions) {
    const parsedDate = parseISO(transaction.date);
    const monthKey = format(parsedDate, "yyyy-MM");
    const bucket = monthBuckets.get(monthKey) ?? { income: 0, expense: 0 };
    if (!transaction.isGoalContribution) {
      if (transaction.type === "income") {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    }
    monthBuckets.set(monthKey, bucket);
  }

  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i);
    const monthKey = format(date, "yyyy-MM");
    const bucket = monthBuckets.get(monthKey) ?? { income: 0, expense: 0 };
    return {
      label: format(date, "MMM", { locale: es }),
      income: bucket.income,
      expense: bucket.expense,
    };
  });
}

export function getChartDataForPeriod(transactions: Transaction[], period: Period, referenceDate: Date = new Date()): MonthlyData[] {
  const now = referenceDate;
  const dailyTotals = new Map<string, { income: number; expense: number }>();
  const weeklyTotals = new Map<number, { income: number; expense: number }>();
  const monthlyTotals = new Map<number, { income: number; expense: number }>();

  const addToBucket = (bucket: { income: number; expense: number } | undefined, transaction: Transaction) => {
    const target = bucket ?? { income: 0, expense: 0 };
    if (!transaction.isGoalContribution) {
      if (transaction.type === "income") {
        target.income += transaction.amount;
      } else {
        target.expense += transaction.amount;
      }
    }
    return target;
  };

  if (period === "week") {
    for (const transaction of transactions) {
      dailyTotals.set(transaction.date, addToBucket(dailyTotals.get(transaction.date), transaction));
    }
  } else if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    for (const transaction of transactions) {
      const parsedDate = parseISO(transaction.date);
      if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month) continue;
      const weekIndex = Math.floor((parsedDate.getDate() - 1) / 7);
      weeklyTotals.set(weekIndex, addToBucket(weeklyTotals.get(weekIndex), transaction));
    }
  } else {
    const year = now.getFullYear();
    for (const transaction of transactions) {
      const parsedDate = parseISO(transaction.date);
      if (parsedDate.getFullYear() !== year) continue;
      const monthIndex = parsedDate.getMonth();
      monthlyTotals.set(monthIndex, addToBucket(monthlyTotals.get(monthIndex), transaction));
    }
  }

  switch (period) {
    case "week": {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayTotals = dailyTotals.get(dayStr) ?? { income: 0, expense: 0 };
        return {
          label: weekLabels[i],
          income: dayTotals.income,
          expense: dayTotals.expense,
        };
      });
    }

    case "month": {
      const daysInMonth = getDaysInMonth(now);
      const numWeeks = Math.ceil(daysInMonth / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const weekTotals = weeklyTotals.get(i) ?? { income: 0, expense: 0 };
        return {
          label: `S${i + 1}`,
          income: weekTotals.income,
          expense: weekTotals.expense,
        };
      });
    }

    case "year": {
      const currentYear = now.getFullYear();
      return Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(currentYear, i, 1);
        const monthTotals = monthlyTotals.get(i) ?? { income: 0, expense: 0 };
        return {
          label: format(monthDate, "MMM", { locale: es }),
          income: monthTotals.income,
          expense: monthTotals.expense,
        };
      });
    }
  }
}

export function formatCurrency(amount: number, currencyCode: string = getCurrentCurrencyCode()): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function compareTransactionsNewestFirst(a: Transaction, b: Transaction): number {
  const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (byDate !== 0) return byDate;

  const aCreatedAt = a.createdAt ? Date.parse(a.createdAt) : 0;
  const bCreatedAt = b.createdAt ? Date.parse(b.createdAt) : 0;
  if (aCreatedAt !== bCreatedAt) return bCreatedAt - aCreatedAt;

  return b.id.localeCompare(a.id);
}

export function groupTransactionsByDate(transactions: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const sorted = [...transactions].sort(compareTransactionsNewestFirst);

  const groups: Record<string, Transaction[]> = {};
  sorted.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  return Object.entries(groups).map(([date, items]) => ({
    date,
    label: formatDateLabel(date),
    items,
  }));
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  const todayDate = new Date();
  const yestDate = new Date(todayDate);
  yestDate.setDate(yestDate.getDate() - 1);

  if (dateStr === format(todayDate, "yyyy-MM-dd")) return "Hoy";
  if (dateStr === format(yestDate, "yyyy-MM-dd")) return "Ayer";
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

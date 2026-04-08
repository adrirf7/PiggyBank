import { Period, Transaction } from "@/types";
import { addDays, endOfMonth, endOfWeek, endOfYear, format, getDaysInMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek, startOfYear, subMonths } from "date-fns";
import { es } from "date-fns/locale";

export function filterByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  const now = new Date();
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

  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(now, months - 1 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthTxs = transactions.filter((t) => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start, end });
    });

    return {
      label: format(date, "MMM", { locale: es }),
      income: getTotalByType(monthTxs, "income"),
      expense: getTotalByType(monthTxs, "expense"),
    };
  });
}

export function getChartDataForPeriod(transactions: Transaction[], period: Period): MonthlyData[] {
  const now = new Date();

  switch (period) {
    case "week": {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayTxs = transactions.filter((t) => t.date === dayStr);
        return {
          label: weekLabels[i],
          income: getTotalByType(dayTxs, "income"),
          expense: getTotalByType(dayTxs, "expense"),
        };
      });
    }

    case "month": {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = getDaysInMonth(now);
      const numWeeks = Math.ceil(daysInMonth / 7);
      return Array.from({ length: numWeeks }, (_, i) => {
        const startDay = i * 7 + 1;
        const endDay = Math.min((i + 1) * 7, daysInMonth);
        const rangeStart = new Date(year, month, startDay);
        const rangeEnd = new Date(year, month, endDay);
        const weekTxs = transactions.filter((t) => {
          const d = parseISO(t.date);
          return isWithinInterval(d, { start: rangeStart, end: rangeEnd });
        });
        return {
          label: `S${i + 1}`,
          income: getTotalByType(weekTxs, "income"),
          expense: getTotalByType(weekTxs, "expense"),
        };
      });
    }

    case "year": {
      const year = now.getFullYear();
      return Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(year, i, 1);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        const monthTxs = transactions.filter((t) => {
          const d = parseISO(t.date);
          return isWithinInterval(d, { start, end });
        });
        return {
          label: format(monthDate, "MMM", { locale: es }),
          income: getTotalByType(monthTxs, "income"),
          expense: getTotalByType(monthTxs, "expense"),
        };
      });
    }
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function groupTransactionsByDate(transactions: Transaction[]): { date: string; label: string; items: Transaction[] }[] {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

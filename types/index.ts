export type TransactionType = "income" | "expense";
export type Period = "week" | "month" | "year";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date "YYYY-MM-DD"
  createdAt?: string; // ISO datetime for ordering inside same day
  recurrence?: RecurrenceType;
  recurrenceMonthDay?: number; // For monthly/quarterly: which day of month (1-31)
  recurrenceWeekDay?: number; // For weekly: which day of week (0-6, 0=Sunday)
  goalId?: string; // ID del objetivo de ahorro relacionado
  isGoalContribution?: boolean; // True si es aportación/retiro de objetivo
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault?: boolean;
  isDeleted?: boolean;
  baseCategoryId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO date "YYYY-MM-DD"
  createdAt: string; // ISO date "YYYY-MM-DD"
}

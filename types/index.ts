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
  recurrence?: RecurrenceType;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
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

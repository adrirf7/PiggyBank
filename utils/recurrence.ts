import { RecurrenceType, Transaction } from "@/types";
import { addDays, addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

/**
 * Calcula la próxima fecha de recurrencia basada en una fecha base y el tipo de recurrencia.
 */
export function getNextRecurrenceDate(baseDate: string, recurrence: RecurrenceType): string {
  const date = parseISO(baseDate);

  switch (recurrence) {
    case "daily":
      return format(addDays(date, 1), "yyyy-MM-dd");
    case "weekly":
      return format(addWeeks(date, 1), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(date, 1), "yyyy-MM-dd");
    case "quarterly":
      return format(addMonths(date, 3), "yyyy-MM-dd");
    case "yearly":
      return format(addYears(date, 1), "yyyy-MM-dd");
    default:
      return baseDate;
  }
}

/**
 * Determina si una transacción recurrente necesita crear una nueva instancia.
 * Retorna true si la transacción es recurrente y su próxima fecha ya ha pasado.
 */
export function shouldCreateRecurrence(transaction: Transaction, today: string): boolean {
  if (!transaction.recurrence || transaction.recurrence === "none") {
    return false;
  }

  const nextDate = getNextRecurrenceDate(transaction.date, transaction.recurrence);
  return nextDate <= today;
}

/**
 * Encuentra todas las transacciones recurrentes que necesitan crear nuevas instancias.
 * Retorna un array de transacciones que deben duplicarse con la nueva fecha.
 */
export function getRecurrencesToCreate(transactions: Transaction[]): Transaction[] {
  const today = format(new Date(), "yyyy-MM-dd");
  const recurrentTxs = transactions.filter((t) => t.recurrence && t.recurrence !== "none");

  // Agrupar por "recurrence key" para encontrar la más reciente de cada serie
  const grouped = new Map<string, Transaction>();

  recurrentTxs.forEach((tx) => {
    // Crear una clave única basada en los datos de la transacción (sin id ni fecha)
    const key = `${tx.type}-${tx.amount}-${tx.category}-${tx.description}-${tx.recurrence}-${tx.goalId || ""}`;
    const existing = grouped.get(key);

    if (!existing || tx.date > existing.date) {
      grouped.set(key, tx);
    }
  });

  // Filtrar las que necesitan crear nueva instancia
  const toCreate: Transaction[] = [];
  grouped.forEach((tx) => {
    if (shouldCreateRecurrence(tx, today)) {
      toCreate.push(tx);
    }
  });

  return toCreate;
}

/**
 * Crea las transacciones recurrentes pendientes.
 * Esta función debe llamarse al iniciar la app o periódicamente.
 */
export async function processRecurrentTransactions(
  transactions: Transaction[],
  addTransaction: (data: Omit<Transaction, "id">) => Promise<void>,
  addGoalContribution?: (data: { goalId: string; type: "income" | "expense"; amount: number; description: string; date: string; recurrence?: RecurrenceType }) => Promise<void>,
): Promise<number> {
  const toCreate = getRecurrencesToCreate(transactions);

  for (const tx of toCreate) {
    const nextDate = getNextRecurrenceDate(tx.date, tx.recurrence!);

    // Si es una aportación a objetivo, usar addGoalContribution
    if (tx.isGoalContribution && tx.goalId && addGoalContribution) {
      await addGoalContribution({
        goalId: tx.goalId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: nextDate,
        recurrence: tx.recurrence,
      });
    } else {
      // Transacción normal - solo incluir campos definidos
      const transactionData: any = {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: nextDate,
        recurrence: tx.recurrence,
      };

      // Solo añadir campos opcionales si existen
      if (tx.goalId) {
        transactionData.goalId = tx.goalId;
      }
      if (tx.isGoalContribution) {
        transactionData.isGoalContribution = tx.isGoalContribution;
      }

      await addTransaction(transactionData);
    }
  }

  return toCreate.length;
}

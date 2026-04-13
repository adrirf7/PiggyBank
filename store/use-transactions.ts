import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, setDoc, writeBatch } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export function useTransactionStore() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const hasProcessedRecurrence = useRef(false);

  const addTransaction = async (data: Omit<Transaction, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "transactions"), data);
  };

  const updateTransaction = async (id: string, data: Omit<Transaction, "id">) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "transactions", id), data);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const transaction = transactions.find((tx) => tx.id === id);

    if (transaction?.isGoalContribution && transaction.goalId) {
      await deleteGoalContribution(id, transaction);
      return;
    }

    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  };

  const deleteTransactions = async (items: Transaction[]) => {
    if (!user || items.length === 0) return;

    const batch = writeBatch(db);
    const seenIds = new Set<string>();
    const goalAdjustments = new Map<string, number>();

    for (const transaction of items) {
      if (seenIds.has(transaction.id)) continue;
      seenIds.add(transaction.id);

      const transactionRef = doc(db, "users", user.uid, "transactions", transaction.id);
      batch.delete(transactionRef);

      if (transaction.isGoalContribution && transaction.goalId) {
        const amountChange = transaction.type === "income" ? -transaction.amount : transaction.amount;
        goalAdjustments.set(transaction.goalId, (goalAdjustments.get(transaction.goalId) || 0) + amountChange);
      }
    }

    for (const [goalId, amountChange] of goalAdjustments.entries()) {
      const goalRef = doc(db, "users", user.uid, "goals", goalId);
      const goalSnap = await getDoc(goalRef);
      if (!goalSnap.exists()) {
        console.warn(`Goal not found while deleting transactions: ${goalId}`);
        continue;
      }
      batch.update(goalRef, {
        currentAmount: increment(amountChange),
      });
    }

    await batch.commit();
  };

  /**
   * Elimina una aportación/retiro a un objetivo y actualiza el monto del objetivo.
   */
  const deleteGoalContribution = async (id: string, transaction: Transaction) => {
    if (!user || !transaction.goalId || !transaction.isGoalContribution) return;

    const batch = writeBatch(db);

    // 1. Eliminar la transacción
    const transactionRef = doc(db, "users", user.uid, "transactions", id);
    batch.delete(transactionRef);

    // 2. Revertir el cambio en el currentAmount del objetivo
    const goalRef = doc(db, "users", user.uid, "goals", transaction.goalId);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      const amountChange = transaction.type === "income" ? -transaction.amount : transaction.amount;
      batch.update(goalRef, {
        currentAmount: increment(amountChange),
      });
    } else {
      console.warn(`Goal not found while deleting goal contribution: ${transaction.goalId}`);
    }

    // 3. Ejecutar batch
    await batch.commit();
  };

  /**
   * Añade una aportación o retiro a un objetivo de ahorro.
   * Actualiza automáticamente el currentAmount del objetivo usando batch write para atomicidad.
   */
  const addGoalContribution = async (data: {
    goalId: string;
    type: "income" | "expense";
    amount: number;
    description: string;
    date: string;
    recurrence?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
    recurrenceMonthDay?: number;
    recurrenceWeekDay?: number;
  }) => {
    if (!user) return;

    const batch = writeBatch(db);

    // 1. Crear la transacción
    const transactionData: Omit<Transaction, "id"> = {
      type: data.type,
      amount: data.amount,
      category: "savings-goal", // Categoría especial para objetivos
      description: data.description,
      date: data.date,
      createdAt: new Date().toISOString(),
      goalId: data.goalId,
      isGoalContribution: true,
      ...(data.recurrence && { recurrence: data.recurrence }),
      ...(data.recurrenceMonthDay !== undefined && { recurrenceMonthDay: data.recurrenceMonthDay }),
      ...(data.recurrenceWeekDay !== undefined && { recurrenceWeekDay: data.recurrenceWeekDay }),
    };

    const transactionRef = doc(collection(db, "users", user.uid, "transactions"));
    batch.set(transactionRef, transactionData);

    // 2. Actualizar el currentAmount del objetivo
    const goalRef = doc(db, "users", user.uid, "goals", data.goalId);
    const amountChange = data.type === "income" ? data.amount : -data.amount;
    batch.update(goalRef, {
      currentAmount: increment(amountChange),
    });

    // 3. Ejecutar batch
    await batch.commit();
  };

  /**
   * Actualiza una aportación o retiro a un objetivo de ahorro.
   * Recalcula el cambio en currentAmount comparando el monto anterior con el nuevo.
   */
  const updateGoalContribution = async (
    id: string,
    oldTransaction: Transaction,
    data: {
      goalId: string;
      type: "income" | "expense";
      amount: number;
      description: string;
      date: string;
      recurrence?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
      recurrenceMonthDay?: number;
      recurrenceWeekDay?: number;
    },
  ) => {
    if (!user || !oldTransaction.goalId || !oldTransaction.isGoalContribution) return;

    const batch = writeBatch(db);

    // 1. Actualizar la transacción
    const transactionRef = doc(db, "users", user.uid, "transactions", id);
    const transactionData: Omit<Transaction, "id"> = {
      type: data.type,
      amount: data.amount,
      category: "savings-goal",
      description: data.description,
      date: data.date,
      goalId: data.goalId,
      isGoalContribution: true,
      ...(data.recurrence && { recurrence: data.recurrence }),
      ...(data.recurrenceMonthDay !== undefined && { recurrenceMonthDay: data.recurrenceMonthDay }),
      ...(data.recurrenceWeekDay !== undefined && { recurrenceWeekDay: data.recurrenceWeekDay }),
    };
    batch.set(transactionRef, transactionData);

    // 2. Calcular el cambio neto en el objetivo
    // Primero revertir el cambio anterior, luego aplicar el nuevo
    const oldAmountChange = oldTransaction.type === "income" ? -oldTransaction.amount : oldTransaction.amount;
    const newAmountChange = data.type === "income" ? data.amount : -data.amount;
    const netChange = oldAmountChange + newAmountChange;

    // 3. Actualizar el currentAmount del objetivo
    const goalRef = doc(db, "users", user.uid, "goals", data.goalId);
    batch.update(goalRef, {
      currentAmount: increment(netChange),
    });

    // 4. Ejecutar batch
    await batch.commit();
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      hasProcessedRecurrence.current = false;
      return;
    }

    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, "id">),
        }));
        setTransactions(txs);
        setLoading(false);
      },
      () => {
        // On permission error (e.g. not logged in), just clear
        setTransactions([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, user]);

  // Procesar transacciones recurrentes una vez cuando se cargan las transacciones
  // DESACTIVADO TEMPORALMENTE - Causaba duplicados al navegar
  // useEffect(() => {
  //   if (loading || !user || transactions.length === 0 || hasProcessedRecurrence.current) {
  //     return;
  //   }
  //
  //   hasProcessedRecurrence.current = true;
  //
  //   // Procesar en background sin bloquear la UI
  //   processRecurrentTransactions(transactions, addTransaction, addGoalContribution).catch((error) => {
  //     console.error("Error processing recurrent transactions:", error);
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [transactions, loading, user]);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    addGoalContribution,
    deleteGoalContribution,
    updateGoalContribution,
  };
}

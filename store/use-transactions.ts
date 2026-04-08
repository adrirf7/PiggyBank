import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { processRecurrentTransactions } from "@/utils/recurrence";
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
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

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
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
      goalId: data.goalId,
      isGoalContribution: true,
      ...(data.recurrence && { recurrence: data.recurrence }),
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

  return { transactions, loading, addTransaction, deleteTransaction, addGoalContribution };
}

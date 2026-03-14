import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useTransactionStore() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
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

  const addTransaction = async (data: Omit<Transaction, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "transactions"), data);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  };

  return { transactions, loading, addTransaction, deleteTransaction };
}

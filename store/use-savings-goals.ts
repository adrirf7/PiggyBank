import { useAccount } from "@/context/account";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { SavingsGoal } from "@/types";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export function useSavingsGoalStore() {
  const { user } = useAuth();
  const { activeAccount, accounts } = useAccount();
  const [allGoals, setAllGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllGoals([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAllGoals(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavingsGoal, "id">) })));
        setLoading(false);
      },
      () => {
        setAllGoals([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, user]);

  const goals = useMemo(() => {
    const filtered = (() => {
      if (!activeAccount) return allGoals;
      const isDefault = activeAccount.isDefault ?? accounts[0]?.id === activeAccount.id;
      return allGoals.filter((goal) => (isDefault ? !goal.accountId || goal.accountId === activeAccount.id : goal.accountId === activeAccount.id));
    })();

    // Sort by explicit order if set, otherwise fall back to createdAt (newest first)
    return [...filtered].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return 0; // already sorted by createdAt desc from Firestore
    });
  }, [allGoals, activeAccount, accounts]);

  const addGoal = async (data: Omit<SavingsGoal, "id">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "goals"), data);
  };

  const updateGoal = async (id: string, data: Partial<Omit<SavingsGoal, "id">>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "goals", id), data);
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "goals", id));
  };

  const reorderGoals = async (orderedGoals: SavingsGoal[]) => {
    if (!user) return;
    const batch = writeBatch(db);
    orderedGoals.forEach((goal, idx) => {
      batch.update(doc(db, "users", user.uid, "goals", goal.id), { order: idx });
    });
    await batch.commit();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, reorderGoals };
}

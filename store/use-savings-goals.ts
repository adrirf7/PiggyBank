import { useAccount } from "@/context/account";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { SavingsGoal } from "@/types";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
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
    if (!activeAccount) return allGoals;
    const isDefault = activeAccount.isDefault ?? accounts[0]?.id === activeAccount.id;
    return allGoals.filter((goal) => (isDefault ? !goal.accountId || goal.accountId === activeAccount.id : goal.accountId === activeAccount.id));
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

  return { goals, loading, addGoal, updateGoal, deleteGoal };
}

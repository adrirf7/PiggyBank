import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { SavingsGoal } from "@/types";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useSavingsGoalStore() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setGoals(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavingsGoal, "id">) })));
        setLoading(false);
      },
      () => {
        setGoals([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, user]);

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

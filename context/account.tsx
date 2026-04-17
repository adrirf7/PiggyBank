import { CARD_THEMES } from "@/constants/card-themes";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Account, SavingsGoal, Transaction } from "@/types";
import { format } from "date-fns";
import { addDoc, collection, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

const MAX_ACCOUNTS = 5;

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  activeAccountId: string | null;
  loading: boolean;
  switchAccount: (id: string) => void;
  addAccount: (name: string, themeId: string, icon?: string) => Promise<string | undefined>;
  updateAccount: (id: string, data: Partial<Pick<Account, "name" | "themeId" | "icon">>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  maxAccounts: number;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  activeAccount: null,
  activeAccountId: null,
  loading: true,
  switchAccount: () => {},
  addAccount: async () => undefined,
  updateAccount: async () => {},
  deleteAccount: async () => {},
  maxAccounts: MAX_ACCOUNTS,
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setActiveAccountId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "users", user.uid, "accounts"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }));

        if (fetched.length === 0) {
          const defaultData: Omit<Account, "id"> = {
            name: "Mi cuenta",
            themeId: CARD_THEMES[0].id,
            icon: "piggy-bank",
            createdAt: format(new Date(), "yyyy-MM-dd"),
            isDefault: true,
          };
          const ref = await addDoc(collection(db, "users", user.uid, "accounts"), defaultData);
          const created = { id: ref.id, ...defaultData };
          setAccounts([created]);
          setActiveAccountId(ref.id);
        } else {
          setAccounts(fetched);
          setActiveAccountId((prev) => {
            if (prev && fetched.find((a) => a.id === prev)) return prev;
            return fetched[0].id;
          });
        }
        setLoading(false);
      },
      () => {
        setAccounts([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid, user]);

  const addAccount = async (name: string, themeId: string, icon = "piggy-bank"): Promise<string | undefined> => {
    if (!user) return;
    if (accounts.length >= MAX_ACCOUNTS) {
      throw new Error("MAX_ACCOUNTS_REACHED");
    }
    const data: Omit<Account, "id"> = {
      name,
      themeId,
      icon,
      createdAt: format(new Date(), "yyyy-MM-dd"),
    };
    const ref = await addDoc(collection(db, "users", user.uid, "accounts"), data);
    return ref.id;
  };

  const updateAccount = async (id: string, data: Partial<Pick<Account, "name" | "themeId" | "icon">>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "accounts", id), data);
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;

    const accountToDelete = accounts.find((account) => account.id === id);
    if (!accountToDelete) return;

    const isDefaultAccount = accountToDelete.isDefault ?? accounts[0]?.id === id;
    const txSnapshot = await getDocs(collection(db, "users", user.uid, "transactions"));
    const batch = writeBatch(db);
    const goalAdjustments = new Map<string, number>();

    for (const txDoc of txSnapshot.docs) {
      const transaction = { id: txDoc.id, ...(txDoc.data() as Omit<Transaction, "id">) };
      const belongsToDeletedAccount = transaction.accountId === id || (isDefaultAccount && !transaction.accountId);

      if (!belongsToDeletedAccount) continue;

      batch.delete(txDoc.ref);

      if (transaction.isGoalContribution && transaction.goalId) {
        const amountChange = transaction.type === "income" ? -transaction.amount : transaction.amount;
        goalAdjustments.set(transaction.goalId, (goalAdjustments.get(transaction.goalId) || 0) + amountChange);
      }
    }

    for (const [goalId, amountChange] of goalAdjustments.entries()) {
      const goalRef = doc(db, "users", user.uid, "goals", goalId);
      const goalSnap = await getDoc(goalRef);
      if (goalSnap.exists()) {
        batch.update(goalRef, { currentAmount: increment(amountChange) });
      }
    }

    const goalsSnapshot = await getDocs(collection(db, "users", user.uid, "goals"));
    for (const goalDoc of goalsSnapshot.docs) {
      const goal = goalDoc.data() as Omit<SavingsGoal, "id">;
      const goalBelongsToDeletedAccount = goal.accountId === id || (isDefaultAccount && !goal.accountId);
      if (goalBelongsToDeletedAccount) {
        batch.delete(goalDoc.ref);
      }
    }

    let replacementAccountId: string | null = null;
    if (accounts.length === 1) {
      const replacementRef = doc(collection(db, "users", user.uid, "accounts"));
      const replacementData: Omit<Account, "id"> = {
        name: "Mi cuenta",
        themeId: CARD_THEMES[0].id,
        icon: "piggy-bank",
        createdAt: format(new Date(), "yyyy-MM-dd"),
        isDefault: true,
      };
      batch.set(replacementRef, replacementData);
      replacementAccountId = replacementRef.id;
    }

    batch.delete(doc(db, "users", user.uid, "accounts", id));
    await batch.commit();

    if (replacementAccountId) {
      setActiveAccountId(replacementAccountId);
    } else if (activeAccountId === id) {
      const nextAccount = accounts.find((account) => account.id !== id) ?? null;
      setActiveAccountId(nextAccount?.id ?? null);
    }
  };

  const switchAccount = (id: string) => setActiveAccountId(id);
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;

  return (
    <AccountContext.Provider value={{ accounts, activeAccount, activeAccountId, loading, switchAccount, addAccount, updateAccount, deleteAccount, maxAccounts: MAX_ACCOUNTS }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}

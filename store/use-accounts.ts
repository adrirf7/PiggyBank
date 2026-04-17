import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Account } from "@/types";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { CARD_THEMES } from "@/constants/card-themes";
import { format } from "date-fns";

const DEFAULT_ACCOUNT_NAME = "Mi cuenta";

export function useAccountStore() {
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

    const q = query(collection(db, "users", user.uid, "accounts"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }));

        if (fetched.length === 0) {
          const defaultAccount: Omit<Account, "id"> = {
            name: DEFAULT_ACCOUNT_NAME,
            themeId: CARD_THEMES[0].id,
            createdAt: format(new Date(), "yyyy-MM-dd"),
            isDefault: true,
          };
          const ref = await addDoc(collection(db, "users", user.uid, "accounts"), defaultAccount);
          setAccounts([{ id: ref.id, ...defaultAccount }]);
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

  const addAccount = async (name: string, themeId: string) => {
    if (!user) return;
    const data: Omit<Account, "id"> = {
      name,
      themeId,
      createdAt: format(new Date(), "yyyy-MM-dd"),
    };
    const ref = await addDoc(collection(db, "users", user.uid, "accounts"), data);
    return ref.id;
  };

  const updateAccount = async (id: string, data: Partial<Pick<Account, "name" | "themeId">>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "accounts", id), data);
  };

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
  };

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;

  return {
    accounts,
    activeAccount,
    activeAccountId,
    loading,
    addAccount,
    updateAccount,
    switchAccount,
  };
}

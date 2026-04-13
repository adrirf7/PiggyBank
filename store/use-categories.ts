import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { addDoc, collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useCategoriesStore() {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!user) {
      setCustomCategories([]);
      return;
    }

    const q = query(collection(db, "users", user.uid, "categories"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categories = snapshot.docs.map((categoryDoc) => ({
          id: categoryDoc.id,
          ...(categoryDoc.data() as Omit<Category, "id">),
          isDefault: false,
        }));
        setCustomCategories(categories);
      },
      () => {
        setCustomCategories([]);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const allCategories = useMemo(() => {
    const defaults: Category[] = [
      ...INCOME_CATEGORIES.map((category) => ({ ...category, isDefault: true })),
      ...EXPENSE_CATEGORIES.map((category) => ({ ...category, isDefault: true })),
    ];
    const deletedBaseIds = new Set(
      customCategories
        .filter((category) => category.baseCategoryId && category.isDeleted)
        .map((category) => category.baseCategoryId!),
    );
    const customByBaseId = new Map(
      customCategories
        .filter((category) => !category.isDeleted && category.baseCategoryId)
        .map((category) => [category.baseCategoryId!, category]),
    );

    const mergedDefaults = defaults
      .filter((defaultCategory) => !deletedBaseIds.has(defaultCategory.id))
      .map((defaultCategory) => {
        const customOverride = customByBaseId.get(defaultCategory.id);
        if (!customOverride) return defaultCategory;
        return {
          ...defaultCategory,
          ...customOverride,
          id: defaultCategory.id,
          isDefault: true,
        };
      });

    const standaloneCustom = customCategories.filter((category) => !category.baseCategoryId && !category.isDeleted);
    return [...mergedDefaults, ...standaloneCustom];
  }, [customCategories]);

  const incomeCategories = useMemo(
    () => allCategories.filter((category) => category.type === "income" && !category.isDeleted),
    [allCategories],
  );
  const expenseCategories = useMemo(
    () => allCategories.filter((category) => category.type === "expense" && !category.isDeleted),
    [allCategories],
  );

  const getCategoryById = useCallback((id: string): Category | undefined => {
    return allCategories.find((category) => category.id === id);
  }, [allCategories]);

  const addCategory = async (data: Omit<Category, "id" | "isDefault">) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "categories"), {
      ...data,
      isDeleted: false,
    });
  };

  const upsertDefaultCategoryOverride = async (categoryId: string, data: Pick<Category, "name" | "icon" | "color" | "type">, isDeleted: boolean) => {
    if (!user) return;

    const existingOverride = customCategories.find((category) => category.baseCategoryId === categoryId);
    if (existingOverride) {
      await updateDoc(doc(db, "users", user.uid, "categories", existingOverride.id), {
        ...data,
        isDeleted,
      });
      return;
    }

    await addDoc(collection(db, "users", user.uid, "categories"), {
      ...data,
      baseCategoryId: categoryId,
      isDeleted,
    });
  };

  const updateCategory = async (id: string, data: Pick<Category, "name" | "icon" | "color">) => {
    if (!user) return;
    const defaultCategory = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find((category) => category.id === id);
    if (defaultCategory) {
      await upsertDefaultCategoryOverride(id, {
        ...data,
        type: defaultCategory.type,
      }, false);
      return;
    }

    const category = customCategories.find((item) => item.id === id);
    if (!category) return;
    await updateDoc(doc(db, "users", user.uid, "categories", category.id), data);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const defaultCategory = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find((category) => category.id === id);
    if (defaultCategory) {
      await upsertDefaultCategoryOverride(id, {
        name: defaultCategory.name,
        icon: defaultCategory.icon,
        color: defaultCategory.color,
        type: defaultCategory.type,
      }, true);
      return;
    }

    const category = customCategories.find((item) => item.id === id);
    if (!category) return;
    await updateDoc(doc(db, "users", user.uid, "categories", category.id), { isDeleted: true });
  };

  return {
    allCategories,
    incomeCategories,
    expenseCategories,
    customCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

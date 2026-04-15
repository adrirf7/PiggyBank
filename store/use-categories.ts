import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { Category } from "@/types";
import { addDoc, collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_CATEGORIES: Category[] = [
  ...INCOME_CATEGORIES.map((category) => ({ ...category, isDefault: true })),
  ...EXPENSE_CATEGORIES.map((category) => ({ ...category, isDefault: true })),
];

const DEFAULT_CATEGORIES_BY_ID = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category]));

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

  const { allCategories, incomeCategories, expenseCategories, categoriesById } = useMemo(() => {
    const deletedBaseIds = new Set<string>();
    const customByBaseId = new Map<string, Category>();
    const standaloneCustom: Category[] = [];

    for (const category of customCategories) {
      if (category.baseCategoryId) {
        if (category.isDeleted) {
          deletedBaseIds.add(category.baseCategoryId);
          continue;
        }
        customByBaseId.set(category.baseCategoryId, category);
        continue;
      }

      if (!category.isDeleted) {
        standaloneCustom.push(category);
      }
    }

    const mergedDefaults: Category[] = [];
    for (const defaultCategory of DEFAULT_CATEGORIES) {
      if (deletedBaseIds.has(defaultCategory.id)) continue;
      const customOverride = customByBaseId.get(defaultCategory.id);
      if (!customOverride) {
        mergedDefaults.push(defaultCategory);
        continue;
      }
      mergedDefaults.push({
        ...defaultCategory,
        ...customOverride,
        id: defaultCategory.id,
        isDefault: true,
      });
    }

    const allCategories = [...mergedDefaults, ...standaloneCustom];
    const incomeCategories: Category[] = [];
    const expenseCategories: Category[] = [];
    const categoriesById = new Map<string, Category>();

    for (const category of allCategories) {
      if (category.isDeleted) continue;
      categoriesById.set(category.id, category);
      if (category.type === "income") {
        incomeCategories.push(category);
      } else if (category.type === "expense") {
        expenseCategories.push(category);
      }
    }

    return { allCategories, incomeCategories, expenseCategories, categoriesById };
  }, [customCategories]);

  const getCategoryById = useCallback((id: string): Category | undefined => categoriesById.get(id), [categoriesById]);

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
    const defaultCategory = DEFAULT_CATEGORIES_BY_ID.get(id);
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
    const defaultCategory = DEFAULT_CATEGORIES_BY_ID.get(id);
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

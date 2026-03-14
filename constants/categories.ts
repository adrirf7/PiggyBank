import { Category } from "@/types";

export const INCOME_CATEGORIES: Category[] = [
  { id: "salary", name: "Salario", icon: "briefcase-outline", color: "#6366F1", type: "income" },
  { id: "freelance", name: "Freelance", icon: "laptop-outline", color: "#3B82F6", type: "income" },
  { id: "investment", name: "Inversión", icon: "trending-up-outline", color: "#F59E0B", type: "income" },
  { id: "business", name: "Negocio", icon: "storefront-outline", color: "#8B5CF6", type: "income" },
  { id: "gift", name: "Regalo", icon: "gift-outline", color: "#EC4899", type: "income" },
  { id: "extra", name: "Extra", icon: "cash-outline", color: "#14B8A6", type: "income" },
  { id: "other_i", name: "Otros", icon: "ellipsis-horizontal-outline", color: "#059669", type: "income" },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "food", name: "Comida", icon: "restaurant-outline", color: "#F97316", type: "expense" },
  { id: "transport", name: "Transporte", icon: "car-outline", color: "#06B6D4", type: "expense" },
  { id: "fun", name: "Ocio", icon: "game-controller-outline", color: "#A855F7", type: "expense" },
  { id: "health", name: "Salud", icon: "medkit-outline", color: "#EF4444", type: "expense" },
  { id: "shopping", name: "Compras", icon: "bag-outline", color: "#F59E0B", type: "expense" },
  { id: "bills", name: "Facturas", icon: "document-text-outline", color: "#0EA5E9", type: "expense" },
  { id: "education", name: "Educación", icon: "school-outline", color: "#3B82F6", type: "expense" },
  { id: "housing", name: "Vivienda", icon: "home-outline", color: "#22C55E", type: "expense" },
  { id: "other_e", name: "Otros", icon: "ellipsis-horizontal-outline", color: "#B45309", type: "expense" },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

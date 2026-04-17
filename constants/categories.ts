import { Category } from "@/types";

export const INCOME_CATEGORIES: Category[] = [
  { id: "salary",      name: "Salario",     icon: "briefcase-outline",    color: "#4ADE80", type: "income" },
  { id: "freelance",   name: "Freelance",   icon: "laptop-outline",       color: "#60A5FA", type: "income" },
  { id: "investment",  name: "Inversión",   icon: "trending-up-outline",  color: "#FBBF24", type: "income" },
  { id: "business",    name: "Negocio",     icon: "storefront-outline",   color: "#FB923C", type: "income" },
  { id: "gift",        name: "Regalo",      icon: "gift-outline",         color: "#F472B6", type: "income" },
  { id: "rent_income", name: "Alquiler",    icon: "home-outline",         color: "#A78BFA", type: "income" },
  { id: "refund",      name: "Reembolso",   icon: "arrow-undo-outline",   color: "#2DD4BF", type: "income" },
  { id: "bonus",       name: "Bonus",       icon: "star-outline",         color: "#FCD34D", type: "income" },
  { id: "extra",       name: "Extra",       icon: "add-circle-outline",   color: "#34D399", type: "income" },
  { id: "other_i",     name: "Otros",       icon: "ellipsis-horizontal-circle-outline", color: "#94A3B8", type: "income" },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "food",          name: "Comida",        icon: "restaurant-outline",   color: "#FB923C", type: "expense" },
  { id: "transport",     name: "Transporte",    icon: "car-outline",          color: "#38BDF8", type: "expense" },
  { id: "housing",       name: "Vivienda",      icon: "home-outline",         color: "#4ADE80", type: "expense" },
  { id: "shopping",      name: "Compras",       icon: "cart-outline",         color: "#FCD34D", type: "expense" },
  { id: "bills",         name: "Facturas",      icon: "receipt-outline",      color: "#60A5FA", type: "expense" },
  { id: "health",        name: "Salud",         icon: "medkit-outline",       color: "#F87171", type: "expense" },
  { id: "fun",           name: "Ocio",          icon: "game-controller-outline", color: "#C084FC", type: "expense" },
  { id: "education",     name: "Educación",     icon: "book-outline",         color: "#818CF8", type: "expense" },
  { id: "subscriptions", name: "Suscripciones", icon: "repeat-outline",       color: "#8B5CF6", type: "expense" },
  { id: "travel",        name: "Viajes",        icon: "airplane-outline",     color: "#0EA5E9", type: "expense" },
  { id: "sport",         name: "Deporte",       icon: "barbell-outline",      color: "#F97316", type: "expense" },
  { id: "pets",          name: "Mascotas",      icon: "paw-outline",          color: "#10B981", type: "expense" },
  { id: "beauty",        name: "Belleza",       icon: "cut-outline",          color: "#EC4899", type: "expense" },
  { id: "other_e",       name: "Otros",         icon: "ellipsis-horizontal-circle-outline", color: "#94A3B8", type: "expense" },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

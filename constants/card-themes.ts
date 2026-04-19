export interface CardTheme {
  id: string;
  name: string;
  colors: [string, string, string];
  accentColor: string;
  chipColor: string;
}

// Middle stop is noticeably lighter → creates the "metallic band" convex look
export const CARD_THEMES: CardTheme[] = [
  {
    id: "carbon-noir",
    name: "Carbón",
    colors: ["#111316", "#262A32", "#0A0C0F"],
    accentColor: "#C4CAD8",
    chipColor: "#5A6270",
  },
  {
    id: "midnight-navy",
    name: "Acero Azul",
    colors: ["#07101E", "#142238", "#040910"],
    accentColor: "#70AEED",
    chipColor: "#C4A422",
  },
  {
    id: "obsidian-purple",
    name: "Titanio Violeta",
    colors: ["#0D0622", "#201248", "#070318"],
    accentColor: "#AC7AEA",
    chipColor: "#CC9EF8",
  },
  {
    id: "emerald-forest",
    name: "Jade",
    colors: ["#061508", "#0E2C14", "#030A06"],
    accentColor: "#38D472",
    chipColor: "#94D8A8",
  },
  {
    id: "crimson-steel",
    name: "Acero Rojo",
    colors: ["#140506", "#2C0A0A", "#0A0304"],
    accentColor: "#E85858",
    chipColor: "#F0A8A8",
  },
  {
    id: "teal-abyss",
    name: "Cobre Teal",
    colors: ["#041214", "#0C2628", "#020A0B"],
    accentColor: "#22C8A8",
    chipColor: "#7ED8C8",
  },
  {
    id: "graphite-gold",
    name: "Oro Antiguo",
    colors: ["#141008", "#26200E", "#090805"],
    accentColor: "#DEB840",
    chipColor: "#ECD060",
  },
];

export function getCardTheme(themeId: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
}

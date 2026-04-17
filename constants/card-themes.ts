export interface CardTheme {
  id: string;
  name: string;
  colors: [string, string, string];
  accentColor: string;
  chipColor: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: "carbon-noir",
    name: "Carbón",
    colors: ["#0F1115", "#1A1D24", "#080A0E"],
    accentColor: "#A3AAB8",
    chipColor: "#6B7280",
  },
  {
    id: "midnight-navy",
    name: "Medianoche",
    colors: ["#0D1B2A", "#1B2A4A", "#0A1628"],
    accentColor: "#4A90D9",
    chipColor: "#D4AF37",
  },
  {
    id: "obsidian-purple",
    name: "Obsidiana",
    colors: ["#1A0A2E", "#2D1554", "#0F0620"],
    accentColor: "#9B59B6",
    chipColor: "#C0A0E0",
  },
  {
    id: "emerald-forest",
    name: "Esmeralda",
    colors: ["#0A1F0F", "#0D3320", "#061410"],
    accentColor: "#27AE60",
    chipColor: "#A8D5B5",
  },
  {
    id: "crimson-steel",
    name: "Carmesí",
    colors: ["#1F0A0A", "#3D1010", "#120606"],
    accentColor: "#C0392B",
    chipColor: "#E8A0A0",
  },
  {
    id: "teal-abyss",
    name: "Abismo",
    colors: ["#0A1F1F", "#0D3333", "#051414"],
    accentColor: "#16A085",
    chipColor: "#7ECECE",
  },
  {
    id: "graphite-gold",
    name: "Grafito",
    colors: ["#1A1A1A", "#2C2C2C", "#111111"],
    accentColor: "#D4AF37",
    chipColor: "#F0D060",
  },
];

export function getCardTheme(themeId: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
}

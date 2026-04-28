export interface CardTheme {
  id: string;
  name: string;
  colors: string[];
  locations: number[];
  accentColor: string;
  bgColor: string; // vibrant color used for the top-of-screen background gradient
}

// 6 stops — wide diffusion: black zone · long fade · center · long fade · accent zone
const L: number[] = [0, 0.04, 0.50, 0.73, 0.94, 1];

export const CARD_THEMES: CardTheme[] = [
  {
    id: "flame",
    name: "Llama",
    colors:    ["#000000", "#000000", "#FF2200", "#FF2200", "#FF8C00", "#FF8C00"],
    locations: L,
    accentColor: "#FFE0D0",
    bgColor: "#FF5200",
  },
  {
    id: "carbon-noir",
    name: "Carbón",
    colors:    ["#000000", "#000000", "#2A3040", "#2A3040", "#5060A0", "#5060A0"],
    locations: L,
    accentColor: "#C4CAD8",
    bgColor: "#3D54CC",
  },
  {
    id: "midnight-navy",
    name: "Acero Azul",
    colors:    ["#000000", "#000000", "#0E2A5C", "#0E2A5C", "#1E72CC", "#1E72CC"],
    locations: L,
    accentColor: "#70AEED",
    bgColor: "#1A6ECC",
  },
  {
    id: "obsidian-purple",
    name: "Titanio Violeta",
    colors:    ["#000000", "#000000", "#280C6E", "#280C6E", "#7020CC", "#7020CC"],
    locations: L,
    accentColor: "#AC7AEA",
    bgColor: "#7B2FBE",
  },
  {
    id: "emerald-forest",
    name: "Jade",
    colors:    ["#000000", "#000000", "#0A2E10", "#0A2E10", "#108C28", "#108C28"],
    locations: L,
    accentColor: "#38D472",
    bgColor: "#1A9440",
  },
  {
    id: "crimson-steel",
    name: "Acero Rojo",
    colors:    ["#000000", "#000000", "#300808", "#300808", "#7A1010", "#7A1010"],
    locations: L,
    accentColor: "#E85858",
    bgColor: "#CC2222",
  },
  {
    id: "teal-abyss",
    name: "Cobre Teal",
    colors:    ["#000000", "#000000", "#0A2830", "#0A2830", "#0E6860", "#0E6860"],
    locations: L,
    accentColor: "#22C8A8",
    bgColor: "#0EA8A0",
  },
  {
    id: "graphite-gold",
    name: "Oro Antiguo",
    colors:    ["#000000", "#000000", "#20180A", "#20180A", "#4A3A08", "#4A3A08"],
    locations: L,
    accentColor: "#DEB840",
    bgColor: "#C49A10",
  },
  {
    id: "sunset",
    name: "Crepúsculo",
    colors:    ["#000000", "#000000", "#660A40", "#660A40", "#CC1470", "#CC1470"],
    locations: L,
    accentColor: "#FF8FAB",
    bgColor: "#E03878",
  },
  {
    id: "rose-gold",
    name: "Oro Rosa",
    colors:    ["#000000", "#000000", "#3A0C18", "#3A0C18", "#7A1830", "#7A1830"],
    locations: L,
    accentColor: "#FECDD3",
    bgColor: "#D63868",
  },
];

export function getCardTheme(themeId: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
}

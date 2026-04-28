import { ImageSourcePropType } from "react-native";

export interface BackgroundImage {
  id: string;
  name: string;
  source: ImageSourcePropType | null;
}

export const BACKGROUND_IMAGES: BackgroundImage[] = [
  { id: "none", name: "Sin fondo", source: null },
  { id: "pexels-steve-34205959", name: "Paisaje 1", source: require("@/assets/Background/pexels-steve-34205959.jpg") },
  { id: "pexels-atelierbyvineeth-35070137", name: "Paisaje 2", source: require("@/assets/Background/pexels-atelierbyvineeth-35070137.jpg") },
  { id: "pexels-caleb-falkenhagen-216813613-28808948", name: "Paisaje 3", source: require("@/assets/Background/pexels-caleb-falkenhagen-216813613-28808948.jpg") },
  { id: "pexels-enesfilm-14866434", name: "Paisaje 4", source: require("@/assets/Background/pexels-enesfilm-14866434.jpg") },
  { id: "pexels-up-modern-2150238322-31032753", name: "Paisaje 5", source: require("@/assets/Background/pexels-up-modern-2150238322-31032753.jpg") },
  { id: "pexels-alonzo-photo-2765040-6678147", name: "Paisaje 6", source: require("@/assets/Background/pexels-alonzo-photo-2765040-6678147.jpg") },
  { id: "pexels-steve-12913151", name: "Paisaje 7", source: require("@/assets/Background/pexels-steve-12913151.jpg") },
  { id: "pexels-vishal-shinde-463185802-15650389", name: "Paisaje 8", source: require("@/assets/Background/pexels-vishal-shinde-463185802-15650389.jpg") },
  { id: "pexels-steve-33866370", name: "Paisaje 9", source: require("@/assets/Background/pexels-steve-33866370.jpg") },
];

export function getBackgroundImage(id?: string | null): BackgroundImage {
  if (!id || id === "none") return BACKGROUND_IMAGES[0];
  return BACKGROUND_IMAGES.find((bg) => bg.id === id) ?? BACKGROUND_IMAGES[0];
}

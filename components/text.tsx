import React from "react";
import { StyleSheet, Text as RNText, TextProps } from "react-native";

const W: Record<string, string> = {
  "100": "DMSans_300Light",
  "200": "DMSans_300Light",
  "300": "DMSans_300Light",
  "400": "DMSans_400Regular",
  normal: "DMSans_400Regular",
  "500": "DMSans_500Medium",
  "600": "DMSans_600SemiBold",
  "700": "DMSans_700Bold",
  bold: "DMSans_700Bold",
  "800": "DMSans_700Bold",
  "900": "DMSans_700Bold",
};

export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style);
  const fontFamily = flat?.fontFamily ?? (W[String(flat?.fontWeight ?? "400")] ?? "DMSans_400Regular");
  return <RNText {...props} style={[{ fontFamily }, style]} />;
}

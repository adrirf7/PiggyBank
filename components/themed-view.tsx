import { View, type ViewProps } from "react-native";

import { Colors } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  darkColor?: string;
};

export function ThemedView({ style, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = darkColor || Colors.dark.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

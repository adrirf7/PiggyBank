import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { PiggyBankSvgIcon } from "./piggy-bank-svg-icon";

export const PIGGY_BANK_ICON = "piggy-bank";

interface Props {
  icon: string;
  size: number;
  color: string;
}

export function CategoryIcon({ icon, size, color }: Props) {
  if (icon === PIGGY_BANK_ICON) {
    const scaledSize = size * 1.6;
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <PiggyBankSvgIcon size={scaledSize} color={color} />
      </View>
    );
  }
  return <Ionicons name={icon as any} size={size} color={color} />;
}

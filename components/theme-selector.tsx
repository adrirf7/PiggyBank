import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeStore } from "@/store/use-theme";

export default function ThemeSelector() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: "light" as const, label: "Claro", icon: "sunny" },
    { value: "dark" as const, label: "Oscuro", icon: "moon" },
    { value: "system" as const, label: "Sistema", icon: "phone-portrait" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + "15" }]}>
          <Ionicons name="color-palette" size={18} color={colors.tint} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Tema</Text>
      </View>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = theme === option.value;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? colors.tint : colors.background,
                  borderColor: isSelected ? colors.tint : colors.border,
                },
              ]}
              onPress={() => setTheme(option.value)}
            >
              <Ionicons name={option.icon as any} size={20} color={isSelected ? "#000" : colors.icon} />
              <Text style={[styles.optionText, { color: isSelected ? "#000" : colors.text }]}>{option.label}</Text>
              {isSelected && <Ionicons name="checkmark-circle" size={18} color="#000" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});

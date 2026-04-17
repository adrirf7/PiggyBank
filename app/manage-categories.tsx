import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from "@/constants/category-presets";
import { CategoryIcon } from "@/components/category-icon";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAlert } from "@/hooks/use-alert";
import { useCategoriesStore } from "@/store/use-categories";
import { Category, TransactionType } from "@/types";

type EditorState = {
  id?: string;
  type: TransactionType;
  name: string;
  icon: string;
  color: string;
};

type Filter = TransactionType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "expense", label: "Gastos" },
  { key: "income", label: "Ingresos" },
];

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const colors = Colors.dark;
  const { alert } = useAlert();
  const { allCategories, addCategory, updateCategory, deleteCategory } = useCategoriesStore();

  const [activeType, setActiveType] = useState<TransactionType>("expense");
  const [editor, setEditor] = useState<EditorState>({
    type: "expense",
    name: "",
    icon: CATEGORY_ICON_OPTIONS[0],
    color: CATEGORY_COLOR_OPTIONS[0],
  });
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contentSlideDirection, setContentSlideDirection] = useState<"left" | "right">("left");
  const [typeSelectorWidth, setTypeSelectorWidth] = useState(0);
  const [editorCardY, setEditorCardY] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const indicatorX = useSharedValue(0);
  const indicatorColorProgress = useSharedValue(activeType === "income" ? 1 : 0);

  const cardBg = "#1E293B";
  const activeColor = activeType === "income" ? INCOME_COLOR : EXPENSE_COLOR;
  const isEditing = !!editor.id;
  const selectorPillWidth = typeSelectorWidth > 8 ? (typeSelectorWidth - 8) / FILTERS.length : 0;
  const activeTypeIndex = FILTERS.findIndex((item) => item.key === activeType);

  const filteredCategories = useMemo(() => allCategories.filter((category) => category.type === activeType && !category.isDeleted), [activeType, allCategories]);

  const selectedCategories = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const selectedSet = new Set(selectedIds);
    return filteredCategories.filter((category) => selectedSet.has(category.id));
  }, [filteredCategories, selectedIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  React.useEffect(() => {
    if (selectorPillWidth <= 0) return;
    indicatorX.value = withTiming(activeTypeIndex * selectorPillWidth, { duration: 220 });
    indicatorColorProgress.value = withTiming(activeType === "income" ? 1 : 0, { duration: 220 });
  }, [activeType, activeTypeIndex, indicatorColorProgress, indicatorX, selectorPillWidth]);

  React.useEffect(() => {
    if (!selectionMode) return;
    const visibleIds = new Set(filteredCategories.map((category) => category.id));
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [filteredCategories, selectionMode]);

  useFocusEffect(
    React.useCallback(() => {
      const backSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!selectionMode) return false;
        setSelectionMode(false);
        setSelectedIds([]);
        return true;
      });

      return () => {
        backSubscription.remove();
      };
    }, [selectionMode]),
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const backgroundColor = indicatorColorProgress.value > 0.5 ? INCOME_COLOR : EXPENSE_COLOR;
    return {
      transform: [{ translateX: indicatorX.value }],
      backgroundColor,
    };
  });

  const resetEditor = () => {
    setEditor({
      type: activeType,
      name: "",
      icon: CATEGORY_ICON_OPTIONS[0],
      color: CATEGORY_COLOR_OPTIONS[0],
    });
  };

  const openCreateEditor = () => {
    resetEditor();
    setShowEditor(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(editorCardY - 12, 0), animated: true });
    }, 90);
  };

  const handleSelectType = (nextType: TransactionType) => {
    if (nextType === activeType) return;
    const currentIndex = FILTERS.findIndex((item) => item.key === activeType);
    const nextIndex = FILTERS.findIndex((item) => item.key === nextType);
    setContentSlideDirection(nextIndex > currentIndex ? "left" : "right");
    setActiveType(nextType);

    if (!isEditing) {
      setEditor((current) => ({
        ...current,
        type: nextType,
      }));
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditor({
      id: category.id,
      type: category.type,
      name: category.name,
      icon: category.icon,
      color: category.color,
    });
    if (category.type !== activeType) {
      handleSelectType(category.type);
    }
    setShowEditor(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(editorCardY - 12, 0), animated: true });
    }, 90);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id];
      if (next.length === 0) setSelectionMode(false);
      return next;
    });
  };

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedCategories.length === 0) return;
    const amountText = selectedCategories.length === 1 ? "1 categoría" : `${selectedCategories.length} categorías`;
    alert("Eliminar categorías", `¿Seguro que quieres eliminar ${amountText}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          for (const category of selectedCategories) {
            await deleteCategory(category.id);
          }
          if (editor.id && selectedCategories.some((category) => category.id === editor.id)) {
            setShowEditor(false);
            resetEditor();
          }
          exitSelectionMode();
        },
      },
    ]);
  };

  const handleSave = async () => {
    const trimmedName = editor.name.trim();
    if (!trimmedName) {
      alert("Nombre requerido", "Introduce un nombre para la categoría.");
      return;
    }

    const duplicatedName = allCategories.some(
      (category) => !category.isDeleted && category.type === editor.type && category.name.trim().toLowerCase() === trimmedName.toLowerCase() && category.id !== editor.id,
    );
    if (duplicatedName) {
      alert("Nombre en uso", "Ya tienes una categoría con ese nombre en este tipo.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editor.id) {
        await updateCategory(editor.id, {
          name: trimmedName,
          icon: editor.icon,
          color: editor.color,
        });
      } else {
        await addCategory({
          type: editor.type,
          name: trimmedName,
          icon: editor.icon,
          color: editor.color,
        });
      }
      resetEditor();
      setShowEditor(false);
    } catch {
      alert("Error", "No se pudo guardar la categoría. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const contentEnteringAnimation = contentSlideDirection === "left" ? SlideInRight.duration(220) : SlideInLeft.duration(220);
  const contentExitingAnimation = contentSlideDirection === "left" ? SlideOutLeft.duration(220) : SlideOutRight.duration(220);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonSecondary }} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100">Categorías</Text>
          <View className="w-10" />
        </View>

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="mx-5 mb-4 rounded-2xl p-4" style={{ backgroundColor: cardBg, ...styles.card }}>
            <Text className="text-xs text-slate-500 dark:text-slate-400">Pulsa una categoría para editarla. Mantén pulsado para seleccionar y borrar varias.</Text>
          </View>

          {!isEditing && (
            <View
              className="relative flex-row mx-5 mb-4 rounded-2xl p-1"
              style={{ backgroundColor: colors.buttonSecondary }}
              onLayout={(event) => setTypeSelectorWidth(event.nativeEvent.layout.width)}
            >
              {selectorPillWidth > 0 && (
                <Animated.View
                  pointerEvents="none"
                  className="absolute top-1 bottom-1 rounded-xl"
                  style={[
                    {
                      left: 4,
                      width: selectorPillWidth,
                    },
                    indicatorStyle,
                  ]}
                />
              )}
              {FILTERS.map(({ key, label }) => (
                <Pressable key={key} className="flex-1 py-3 items-center rounded-2xl" onPress={() => handleSelectType(key)}>
                  <Text className="text-sm font-semibold" style={{ color: activeType === key ? "#fff" : colors.muted }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Animated.View key={activeType} entering={contentEnteringAnimation} exiting={contentExitingAnimation}>
            {!isEditing && (
              <View className="mx-5 mb-3">
                <Pressable className="rounded-2xl py-3.5 px-4 flex-row items-center justify-center gap-x-2" style={{ backgroundColor: activeColor }} onPress={openCreateEditor}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text className="text-sm font-semibold text-white">Crear categoría</Text>
                </Pressable>
              </View>
            )}

            {showEditor && (
              <Animated.View
                entering={FadeInDown.duration(220)}
                className="mx-5 mb-5 rounded-2xl p-4"
                style={{ backgroundColor: cardBg, ...styles.card }}
                onLayout={(event) => setEditorCardY(event.nativeEvent.layout.y)}
              >
                <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{isEditing ? "Editar categoría" : "Nueva categoría"}</Text>
                <View
                  className="rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3 mb-4"
                  style={[styles.inputCard, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                >
                  <Ionicons name="text-outline" size={18} color={colors.muted} />
                  <TextInput
                    className="flex-1 text-sm"
                    style={{ color: colors.text }}
                    placeholder="Nombre de la categoría"
                    placeholderTextColor={colors.muted}
                    value={editor.name}
                    onChangeText={(name) => setEditor((current) => ({ ...current, name }))}
                    maxLength={30}
                  />
                </View>

                <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Símbolo</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {CATEGORY_ICON_OPTIONS.map((icon) => (
                    <Pressable
                      key={icon}
                      className="w-11 h-11 rounded-xl items-center justify-center border"
                      style={{
                        backgroundColor: editor.icon === icon ? editor.color + "20" : "transparent",
                        borderColor: editor.icon === icon ? editor.color : colors.border,
                      }}
                      onPress={() => setEditor((current) => ({ ...current, icon }))}
                    >
                      <CategoryIcon icon={icon} size={20} color={editor.icon === icon ? editor.color : colors.muted} />
                    </Pressable>
                  ))}
                </View>

                <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Color</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {CATEGORY_COLOR_OPTIONS.map((color) => (
                    <Pressable
                      key={color}
                      className="w-8 h-8 rounded-full"
                      style={{
                        backgroundColor: color,
                        borderWidth: editor.color === color ? 3 : 1,
                        borderColor: editor.color === color ? "#F8FAFC" : "transparent",
                      }}
                      onPress={() => setEditor((current) => ({ ...current, color }))}
                    />
                  ))}
                </View>

                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: colors.buttonSecondary }}>
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: editor.color + "20" }}>
                    <CategoryIcon icon={editor.icon} size={20} color={editor.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                      {editor.name.trim() || "Vista previa"}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">{editor.type === "income" ? "Ingreso" : "Gasto"}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    className="flex-1 py-3 rounded-xl items-center border"
                    style={{ borderColor: colors.border }}
                    onPress={() => {
                      resetEditor();
                      setShowEditor(false);
                    }}
                  >
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      Cancelar
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{ backgroundColor: activeColor, opacity: saving ? 0.7 : 1 }}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text className="text-sm font-semibold text-white">{isEditing ? "Guardar cambios" : "Crear categoría"}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            <View className="mx-5 mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categorías ({filteredCategories.length})</Text>
              {selectionMode && (
                <Pressable onPress={exitSelectionMode}>
                  <Text className="text-xs font-semibold" style={{ color: colors.muted }}>
                    Cancelar
                  </Text>
                </Pressable>
              )}
            </View>

            <View className="mx-5 rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, ...styles.card }}>
              {filteredCategories.length === 0 ? (
                <View className="px-4 py-5">
                  <Text className="text-sm text-slate-500 dark:text-slate-400">No hay categorías visibles para {activeType === "income" ? "ingresos" : "gastos"}.</Text>
                </View>
              ) : (
                filteredCategories.map((category, index) => {
                  const selected = selectedIdSet.has(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      className="px-4 py-3.5 flex-row items-center"
                      style={{
                        backgroundColor: selected ? "#334155" : "transparent",
                        borderWidth: selectionMode ? 1 : 0,
                        borderColor: selected ? "#EF4444" : "transparent",
                      }}
                      onPress={() => (selectionMode ? toggleSelected(category.id) : handleEditCategory(category))}
                      onLongPress={() => enterSelectionMode(category.id)}
                    >
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: category.color + "20" }}>
                        <CategoryIcon icon={category.icon} size={20} color={category.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">{category.name}</Text>
                        <Text className="text-xs text-slate-400 dark:text-slate-500">{category.isDefault ? "Sistema" : "Personalizada"}</Text>
                      </View>
                      {selectionMode && <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={20} color={selected ? "#EF4444" : "#64748B"} />}
                      {!selectionMode && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
                      {index < filteredCategories.length - 1 && (
                        <View style={{ position: "absolute", left: 12, right: 12, bottom: 0, height: 1, backgroundColor: colors.border }} />
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </Animated.View>
        </ScrollView>

        {selectionMode && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Pressable
              className="absolute bottom-8 left-6 right-6 rounded-2xl py-4 items-center justify-center"
              style={[styles.fab, { backgroundColor: selectedIds.length > 0 ? "#EF4444" : "#334155" }]}
              disabled={selectedIds.length === 0}
              onPress={handleDeleteSelected}
            >
              <Text className="text-white font-bold text-sm">Eliminar seleccionadas ({selectedIds.length})</Text>
            </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCard: {
    borderWidth: 1,
  },
  fab: {
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});

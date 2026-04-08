import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function EditProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const { user, userProfile, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.displayName ?? "");
  const [photoBase64, setPhotoBase64] = useState<string | null>(userProfile?.photoBase64 ?? null);
  const [saving, setSaving] = useState(false);

  // Keep photo in sync if profile loads after render
  useEffect(() => {
    if (userProfile?.photoBase64 !== undefined) {
      setPhotoBase64(userProfile.photoBase64 ?? null);
    }
  }, [userProfile?.photoBase64]);

  const initials = (user?.displayName ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.35,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhotoBase64(result.assets[0].base64);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert("Eliminar foto", "¿Eliminar la foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => setPhotoBase64(null) },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Por favor introduce tu nombre.");
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: name.trim(),
        photoBase64: photoBase64,
      });
      router.back();
    } catch {
      Alert.alert("Error", "No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Header ── */}
          <LinearGradient colors={["#F97316", "#FBBF24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <View style={styles.circleDecor1} />
            <View style={styles.circleDecor2} />

            {/* Close button */}
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>

            <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
              {/* Avatar */}
              <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
                {photoBase64 ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${photoBase64}` }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                {/* Camera badge */}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </Pressable>

              <Text style={styles.headerTitle}>Editar perfil</Text>
              <Text style={styles.headerSub}>Toca la foto para cambiarla</Text>
            </Animated.View>
          </LinearGradient>

          {/* ── Form ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[styles.card, { backgroundColor: cardBg }]}>
            {/* Name field */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.muted }]}>Nombre</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Ionicons name="person-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            {/* Email (read-only) */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.muted }]}>Correo electrónico</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border, opacity: 0.7 }]}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <Text style={[styles.textInput, { color: colors.muted }]} numberOfLines={1}>
                  {user?.email}
                </Text>
                <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
              </View>
            </View>

            {/* Photo actions */}
            {photoBase64 && (
              <Pressable onPress={handleRemovePhoto} style={styles.removePhotoBtn}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.removePhotoText}>Eliminar foto de perfil</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* ── Save button ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ marginHorizontal: 20, marginTop: 8 }}>
            <Pressable style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Guardar cambios</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 240,
    overflow: "hidden",
    justifyContent: "flex-end",
    paddingBottom: 28,
  },
  circleDecor1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -40,
  },
  circleDecor2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  avatarSection: { alignItems: "center" },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
  },
  avatarInitials: { color: PRIMARY, fontSize: 28, fontWeight: "800" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  fieldWrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  textInput: { flex: 1, fontSize: 15 },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignSelf: "flex-start",
  },
  removePhotoText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

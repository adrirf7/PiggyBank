import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";

export default function LoginScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      // AuthGate will redirect automatically
    } catch (e: any) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Brand header ── */}
          <LinearGradient colors={["#182236", "#0A0E18"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <Animated.View entering={FadeInDown.duration(500)} style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Ionicons name="wallet" size={36} color={PRIMARY} />
              </View>
              <Text style={styles.brandName}>PiggyBank</Text>
              <Text style={styles.brandTagline}>Tu gestor de finanzas personal</Text>
            </Animated.View>
          </LinearGradient>

          {/* ── Form card ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Iniciar sesión</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Bienvenido de nuevo 👋</Text>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.muted }]}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.muted }]}>Contraseña</Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Login button */}
            <Pressable style={[styles.btn, { backgroundColor: PRIMARY, opacity: loading ? 0.7 : 1 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
            </Pressable>

            {/* Google sign-in */}
            <GoogleSignInSection setError={setError} colors={colors} />

            {/* Register link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.muted }]}>¿No tienes cuenta? </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text style={[styles.footerLink, { color: PRIMARY }]}>Regístrate</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoogleSignInSection({ setError, colors }: { setError: (msg: string) => void; colors: typeof Colors.dark }) {
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGooglePress = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      const errorCode = e.code ?? e.message ?? String(e);
      console.error("Google Sign-In handler error:", errorCode);
      setError(friendlyError(errorCode));
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDisabled = googleLoading;

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>o continúa con</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>
      <Pressable
        style={[styles.googleBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border, opacity: isDisabled ? 0.6 : 1 }]}
        onPress={handleGooglePress}
        disabled={isDisabled}
      >
        {googleLoading ? (
          <ActivityIndicator color={PRIMARY} />
        ) : (
          <>
            <GoogleIcon />
            <Text style={[styles.googleBtnText, { color: colors.text }]}>Continuar con Google</Text>
          </>
        )}
      </Pressable>
    </>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/invalid-email":
      return "El formato del correo no es válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Inténtalo más tarde.";
    case "auth/operation-not-allowed":
      return "El inicio de sesión con correo no está habilitado.";
    case "auth/network-request-failed":
      return "Error de red. Comprueba tu conexión.";
    case "10":
      return "Error interno de Google Sign-In. Verifica tu configuración de Google Cloud Console.";
    case "SIGN_IN_FAILED":
    case "sign_in_failed":
      return "Error al iniciar sesión con Google. Intenta de nuevo.";
    default:
      return `Error inesperado (${code}). Inténtalo de nuevo.`;
  }
}

const styles = StyleSheet.create({
  header: {
    height: 240,
    overflow: "hidden",
    justifyContent: "flex-end",
    paddingBottom: 32,
  },
  circle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 20,
  },
  logoWrap: { alignItems: "center", paddingHorizontal: 24 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { color: "#EF4444", fontSize: 13, flex: 1 },
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "500" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 10,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "700" },
});

function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20 }}>
      <Text style={{ fontSize: 18, lineHeight: 20 }}>G</Text>
    </View>
  );
}

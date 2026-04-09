import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemeSelector from "@/components/theme-selector";
import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionStore } from "@/store/use-transactions";
import { formatCurrency, getTotalByType } from "@/utils/calculations";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { alert } = useAlert();
  const { user, userProfile, signOut } = useAuth();
  const { transactions, loading } = useTransactionStore();
  const [signingOut, setSigningOut] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimationCycle((prev) => prev + 1);
    }, [])
  );

  const totalIncome = getTotalByType(transactions, "income");
  const totalExpense = getTotalByType(transactions, "expense");
  const balance = totalIncome - totalExpense;
  const txCount = transactions.length;

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";

  const initials = (user?.displayName ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = () => {
    alert("Cerrar sesión", "¿Seguro que quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <LinearGradient colors={["#F97316", "#FBBF24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <Animated.View key={`profile-header-${animationCycle}`} entering={FadeInDown.duration(400).delay(0)} style={styles.profileWrap}>
            <Pressable onPress={() => router.push("/edit-profile")} style={styles.avatar}>
              {userProfile?.photoBase64 ? (
                <Image source={{ uri: `data:image/jpeg;base64,${userProfile.photoBase64}` }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </Pressable>
            <Text style={styles.displayName}>{user?.displayName ?? "Usuario"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Pressable onPress={() => router.push("/edit-profile")} style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
              <Text style={styles.editBadgeText}>Editar perfil</Text>
            </Pressable>
          </Animated.View>
        </LinearGradient>

        {/* ── Stats ── */}
        {!loading && (
          <Animated.View key={`profile-stats-${animationCycle}`} entering={FadeInDown.duration(400).delay(80)} style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: INCOME_COLOR }]}>{formatCurrency(totalIncome)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Ingresos totales</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: EXPENSE_COLOR }]}>{formatCurrency(totalExpense)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Gastos totales</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Summary card ── */}
        {!loading && (
          <Animated.View key={`profile-summary-${animationCycle}`} entering={FadeInDown.duration(400).delay(120)} style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Saldo neto</Text>
              <Text style={[styles.summaryValue, { color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }]}>
                {balance >= 0 ? "+" : ""}
                {formatCurrency(balance)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Transacciones</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{txCount}</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Account info ── */}
        <Animated.View key={`profile-account-${animationCycle}`} entering={FadeInDown.duration(400).delay(160)} style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Cuenta</Text>
          <InfoRow icon="mail-outline" label="Correo electrónico" value={user?.email ?? "—"} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="person-outline" label="Nombre" value={user?.displayName ?? "No especificado"} colors={colors} />
        </Animated.View>

        {/* ── Theme Selector ── */}
        <Animated.View key={`profile-theme-${animationCycle}`} entering={FadeInDown.duration(400).delay(210)}>
          <ThemeSelector />
        </Animated.View>

        {/* ── Sign out ── */}
        <Animated.View key={`profile-signout-${animationCycle}`} entering={FadeInDown.duration(400).delay(250)} style={{ marginHorizontal: 20 }}>
          <Pressable style={[styles.signOutBtn, { opacity: signingOut ? 0.6 : 1 }]} onPress={handleSignOut} disabled={signingOut}>
            {signingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.signOutText}>Cerrar sesión</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: PRIMARY + "15" }]}>
        <Ionicons name={icon as any} size={17} color={PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 220, overflow: "hidden", justifyContent: "flex-end", paddingBottom: 28 },
  circle1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -40 },
  circle2: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 20 },
  profileWrap: { alignItems: "center" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: "hidden",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: PRIMARY, fontSize: 26, fontWeight: "800" },
  displayName: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  email: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 8 },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  editBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 20, gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 11, textAlign: "center" },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 15, fontWeight: "700" },
  divider: { height: 1, marginVertical: 10 },
  section: {
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
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  signOutBtn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  signOutText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});

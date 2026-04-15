import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, EXPENSE_COLOR, INCOME_COLOR, PRIMARY } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useTransactionStore } from "@/store/use-transactions";
import { formatCurrency, getTotalByType } from "@/utils/calculations";
import { DEFAULT_COUNTRY, getCountryCurrencyOptions } from "@/utils/currency";

export default function ProfileScreen() {
  const colors = Colors.dark;
  const router = useRouter();
  const { alert } = useAlert();
  const { user, userProfile, signOut, updateUserProfile } = useAuth();
  const currencyCode = userProfile?.currencyCode;
  const selectedCountry = userProfile?.country ?? DEFAULT_COUNTRY;
  const [countrySearch, setCountrySearch] = useState("");
  const { transactions, loading } = useTransactionStore();
  const [signingOut, setSigningOut] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const totalIncome = getTotalByType(transactions, "income");
  const totalExpense = getTotalByType(transactions, "expense");
  const balance = totalIncome - totalExpense;
  const txCount = transactions.length;

  const cardBg = colors.card;

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

  const handleSelectCountry = async (country: string) => {
    if (country === selectedCountry) return;
    try {
      await updateUserProfile({ country });
    } catch {
      alert("Error", "No se pudo cambiar el país de divisa. Inténtalo de nuevo.");
    }
  };

  const countryOptions = getCountryCurrencyOptions();
  const visibleCountryOptions = countryOptions.filter((option) => option.country.toLowerCase().includes(countrySearch.trim().toLowerCase()));
  const selectedCountryOption = countryOptions.find((option) => option.country === selectedCountry);

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Header ── */}
        <LinearGradient colors={["#F97316", "#FBBF24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <Animated.View entering={FadeInDown.duration(400).delay(0)} style={styles.profileWrap}>
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
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: INCOME_COLOR }]}>{formatCurrency(totalIncome, currencyCode)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Ingresos totales</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: EXPENSE_COLOR }]}>{formatCurrency(totalExpense, currencyCode)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Gastos totales</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Summary card ── */}
        {!loading && (
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={[styles.summaryCard, { backgroundColor: cardBg }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>Saldo neto</Text>
              <Text style={[styles.summaryValue, { color: balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR }]}>
                {balance >= 0 ? "+" : ""}
                {formatCurrency(balance, currencyCode)}
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
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Cuenta</Text>
          <InfoRow icon="mail-outline" label="Correo electrónico" value={user?.email ?? "—"} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="person-outline" label="Nombre" value={user?.displayName ?? "No especificado"} colors={colors} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(185)} style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Categorías</Text>
          <Pressable
            style={[styles.manageCategoriesBtn, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}
            onPress={() => router.push("/manage-categories")}
          >
            <View style={styles.manageCategoriesLeft}>
              <View style={[styles.infoIcon, { backgroundColor: PRIMARY + "15" }]}>
                <Ionicons name="pricetags-outline" size={17} color={PRIMARY} />
              </View>
              <View>
                <Text style={[styles.manageCategoriesTitle, { color: colors.text }]}>Gestionar categorías</Text>
                <Text style={[styles.manageCategoriesSubtitle, { color: colors.muted }]}>Crear, editar y borrar tus categorías personalizadas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(198)} style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>País de divisa</Text>
          {!!selectedCountryOption && (
            <Text style={[styles.selectedCountryText, { color: colors.muted }]}>
              Actual: {selectedCountryOption.country} · {selectedCountryOption.code} ({selectedCountryOption.symbol})
            </Text>
          )}
          <View style={[styles.countrySearchWrap, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              placeholder="Buscar país..."
              placeholderTextColor={colors.muted}
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={[styles.countrySearchInput, { color: colors.text }]}
            />
          </View>
          <View style={styles.currencyOptions}>
            {visibleCountryOptions.map((option) => {
              const selected = option.country === selectedCountry;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelectCountry(option.country)}
                  style={[
                    styles.currencyChip,
                    {
                      borderColor: selected ? PRIMARY : colors.border,
                      backgroundColor: selected ? PRIMARY + "20" : colors.buttonSecondary,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? PRIMARY : colors.text, fontWeight: selected ? "700" : "500", fontSize: 12 }}>
                    {option.country} · {option.code} ({option.symbol})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Sign out ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={{ marginHorizontal: 20 }}>
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
  manageCategoriesBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  manageCategoriesLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 },
  manageCategoriesTitle: { fontSize: 14, fontWeight: "700" },
  manageCategoriesSubtitle: { fontSize: 11, marginTop: 1 },
  currencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countrySearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  countrySearchInput: {
    fontSize: 13,
    flex: 1,
  },
  selectedCountryText: {
    fontSize: 12,
    marginBottom: 8,
  },
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

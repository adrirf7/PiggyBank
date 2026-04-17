import { BankCard } from "@/components/bank-card";
import { CategoryIcon } from "@/components/category-icon";
import { CARD_THEMES, getCardTheme } from "@/constants/card-themes";
import { Colors, PRIMARY } from "@/constants/theme";
import { useAccount } from "@/context/account";
import { useAuth } from "@/context/auth";
import { useAlert } from "@/hooks/use-alert";
import { useTransactionStore } from "@/store/use-transactions";
import { Account } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCOUNT_ICONS = [
  "piggy-bank",
  "card-outline",
  "cash-outline",
  "business-outline",
  "briefcase-outline",
  "home-outline",
  "car-outline",
  "airplane-outline",
  "gift-outline",
  "heart-outline",
  "star-outline",
  "flash-outline",
  "planet-outline",
];

export default function ManageAccountsScreen() {
  const router = useRouter();
  const colors = Colors.dark;
  const { accounts, addAccount, updateAccount, deleteAccount, maxAccounts } = useAccount();
  const { user, userProfile } = useAuth();
  const { alert } = useAlert();
  const { transactions } = useTransactionStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editThemeId, setEditThemeId] = useState(CARD_THEMES[0].id);
  const [editIcon, setEditIcon] = useState("piggy-bank");

  const [newName, setNewName] = useState("");
  const [newThemeId, setNewThemeId] = useState(CARD_THEMES[0].id);
  const [newIcon, setNewIcon] = useState("piggy-bank");
  const [saving, setSaving] = useState(false);
  const reachedAccountLimit = accounts.length >= maxAccounts;

  const accountStatsById = useMemo(() => {
    return new Map(
      accounts.map((account, idx) => {
        const isDefault = account.isDefault ?? idx === 0;
        const accountTxs = transactions.filter((tx) => (isDefault ? !tx.accountId || tx.accountId === account.id : tx.accountId === account.id));
        const income = { normal: 0, goal: 0 };
        const expense = { normal: 0, goal: 0 };
        for (const tx of accountTxs) {
          const target = tx.type === "income" ? income : expense;
          if (tx.isGoalContribution) target.goal += tx.amount;
          else target.normal += tx.amount;
        }
        return [
          account.id,
          {
            balance: income.normal - expense.normal - income.goal + expense.goal,
            totalIncome: income.normal,
            totalExpense: expense.normal,
            totalSaved: income.goal - expense.goal,
          },
        ];
      }),
    );
  }, [accounts, transactions]);

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditThemeId(account.themeId);
    setEditIcon(account.icon || "piggy-bank");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      await updateAccount(editingId, { name: editName.trim(), themeId: editThemeId, icon: editIcon });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (reachedAccountLimit) {
      alert("Límite alcanzado", `Solo puedes tener un máximo de ${maxAccounts} cuentas.`);
      return;
    }
    setSaving(true);
    try {
      await addAccount(newName.trim(), newThemeId, newIcon);
      setNewName("");
      setNewThemeId(CARD_THEMES[0].id);
      setNewIcon("piggy-bank");
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_ACCOUNTS_REACHED") {
        alert("Límite alcanzado", `Solo puedes tener un máximo de ${maxAccounts} cuentas.`);
      } else {
        alert("Error", "No se pudo crear la cuenta.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (account: Account) => {
    alert("Eliminar cuenta", `Vas a eliminar "${account.name}". Se borrarán todas sus transacciones y aportaciones relacionadas. Esta acción no se puede deshacer.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            await deleteAccount(account.id);
          } catch {
            alert("Error", "No se pudo eliminar la cuenta.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Mis cuentas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* ── Create new account ────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 24 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>NUEVA CUENTA</Text>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              {accounts.length}/{maxAccounts}
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Nombre</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Nombre de la cuenta"
            placeholderTextColor={colors.muted}
            value={newName}
            onChangeText={setNewName}
            editable={!reachedAccountLimit && !saving}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Diseño de tarjeta</Text>
          <ThemePicker selectedId={newThemeId} onSelect={setNewThemeId} />
          <Text style={[styles.label, { color: colors.muted }]}>Icono</Text>
          <IconPicker selectedIcon={newIcon} onSelect={setNewIcon} />

          {newName.trim().length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <BankCard
                theme={getCardTheme(newThemeId)}
                accountName={newName.trim()}
                balance={0}
                totalIncome={0}
                totalExpense={0}
                totalSaved={0}
                currencyCode={userProfile?.currencyCode}
                accountIcon={newIcon}
                userName={user?.displayName || undefined}
                userCountry={userProfile?.country}
              />
            </View>
          )}

          {reachedAccountLimit && <Text style={{ color: "#F59E0B", fontSize: 13, marginBottom: 12 }}>Has alcanzado el máximo de {maxAccounts} cuentas.</Text>}

          <Pressable
            style={[styles.btn, { backgroundColor: PRIMARY, opacity: saving || !newName.trim() || reachedAccountLimit ? 0.5 : 1 }]}
            onPress={handleCreate}
            disabled={saving || !newName.trim() || reachedAccountLimit}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Crear cuenta</Text>
          </Pressable>
        </View>

        {/* ── Existing accounts ─────────────────────────────────── */}
        {accounts.length > 0 ? (
          <View style={{ gap: 12, marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>CUENTAS</Text>
            {accounts.map((account) =>
              editingId === account.id ? (
                /* ── Inline editor ── */
                <View key={account.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.label, { color: colors.muted }]}>Nombre</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Nombre de la cuenta"
                    placeholderTextColor={colors.muted}
                    autoFocus
                  />
                  <Text style={[styles.label, { color: colors.muted }]}>Diseño</Text>
                  <ThemePicker selectedId={editThemeId} onSelect={setEditThemeId} />
                  <Text style={[styles.label, { color: colors.muted }]}>Icono</Text>
                  <IconPicker selectedIcon={editIcon} onSelect={setEditIcon} />
                  {/* Preview */}
                  <View style={{ marginBottom: 16 }}>
                    <BankCard
                      theme={getCardTheme(editThemeId)}
                      accountName={editName.trim() || account.name}
                      balance={accountStatsById.get(account.id)?.balance ?? 0}
                      totalIncome={accountStatsById.get(account.id)?.totalIncome ?? 0}
                      totalExpense={accountStatsById.get(account.id)?.totalExpense ?? 0}
                      totalSaved={accountStatsById.get(account.id)?.totalSaved ?? 0}
                      currencyCode={userProfile?.currencyCode}
                      accountIcon={editIcon}
                      userName={user?.displayName || undefined}
                      userCountry={userProfile?.country}
                    />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable style={[styles.btn, { flex: 1, backgroundColor: colors.buttonSecondary }]} onPress={cancelEdit}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, { flex: 1, backgroundColor: PRIMARY, opacity: saving || !editName.trim() ? 0.5 : 1 }]}
                      onPress={saveEdit}
                      disabled={saving || !editName.trim()}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Guardar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* ── Account card with edit button ── */
                <View key={account.id} style={{ position: "relative" }}>
                  <BankCard
                    theme={getCardTheme(account.themeId)}
                    accountName={account.name}
                    balance={accountStatsById.get(account.id)?.balance ?? 0}
                    totalIncome={accountStatsById.get(account.id)?.totalIncome ?? 0}
                    totalExpense={accountStatsById.get(account.id)?.totalExpense ?? 0}
                    totalSaved={accountStatsById.get(account.id)?.totalSaved ?? 0}
                    currencyCode={userProfile?.currencyCode}
                    accountIcon={account.icon}
                    userName={user?.displayName || undefined}
                    userCountry={userProfile?.country}
                  />
                  <Pressable style={[styles.editBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]} onPress={() => startEdit(account)} hitSlop={8}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </Pressable>
                  <Pressable style={[styles.deleteBtn, { backgroundColor: "rgba(239,68,68,0.9)" }]} onPress={() => handleDelete(account)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                  </Pressable>
                </View>
              ),
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>No hay cuentas todavía.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemePicker({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {CARD_THEMES.map((theme) => (
          <Pressable
            key={theme.id}
            onPress={() => onSelect(theme.id)}
            style={[styles.themeChip, { backgroundColor: theme.colors[0], borderColor: selectedId === theme.id ? theme.accentColor : "transparent" }]}
          >
            <View style={[styles.themeAccentDot, { backgroundColor: theme.accentColor }]} />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{theme.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function IconPicker({ selectedIcon, onSelect }: { selectedIcon: string; onSelect: (icon: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {ACCOUNT_ICONS.map((icon) => (
          <Pressable key={icon} onPress={() => onSelect(icon)} style={[styles.iconChip, selectedIcon === icon && styles.iconChipActive]}>
            <CategoryIcon icon={icon} size={18} color="#fff" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  themeChip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeAccentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#243043",
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconChipActive: {
    borderColor: PRIMARY,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

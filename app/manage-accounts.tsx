import { CategoryIcon } from "@/components/category-icon";
import { Text } from "@/components/text";
import { CARD_THEMES } from "@/constants/card-themes";
import { Colors, PRIMARY } from "@/constants/theme";
import { useAccount } from "@/context/account";
import { useAlert } from "@/hooks/use-alert";
import { useTransactionStore } from "@/store/use-transactions";
import { Account } from "@/types";
import { formatCurrency } from "@/utils/calculations";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
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
  const { alert } = useAlert();
  const { transactions } = useTransactionStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("piggy-bank");

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("piggy-bank");
  const [saving, setSaving] = useState(false);
  const reachedAccountLimit = accounts.length >= maxAccounts;

  const accountStatsById = useMemo(() => {
    return new Map(
      accounts.map((account, idx) => {
        const isDefault = account.isDefault ?? idx === 0;
        const accountTxs = transactions.filter((tx) =>
          isDefault ? !tx.accountId || tx.accountId === account.id : tx.accountId === account.id,
        );
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
          },
        ];
      }),
    );
  }, [accounts, transactions]);

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditIcon(account.icon || "piggy-bank");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      await updateAccount(editingId, { name: editName.trim(), icon: editIcon });
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
      await addAccount(newName.trim(), CARD_THEMES[0].id, newIcon);
      setNewName("");
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
    alert(
      "Eliminar cuenta",
      `Vas a eliminar "${account.name}". Se borrarán todas sus transacciones y aportaciones relacionadas. Esta acción no se puede deshacer.`,
      [
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
      ],
    );
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

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Create new account ── */}
        {!editingId && (
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

            <Text style={[styles.label, { color: colors.muted }]}>Icono</Text>
            <IconPicker selectedIcon={newIcon} onSelect={setNewIcon} />

            {reachedAccountLimit && (
              <Text style={{ color: "#F59E0B", fontSize: 13, marginBottom: 12 }}>
                Has alcanzado el máximo de {maxAccounts} cuentas.
              </Text>
            )}

            <Pressable
              style={[styles.btn, { backgroundColor: PRIMARY, opacity: saving || !newName.trim() || reachedAccountLimit ? 0.5 : 1 }]}
              onPress={handleCreate}
              disabled={saving || !newName.trim() || reachedAccountLimit}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Crear cuenta</Text>
            </Pressable>
          </View>
        )}

        {/* ── Existing accounts ── */}
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
                  <Text style={[styles.label, { color: colors.muted }]}>Icono</Text>
                  <IconPicker selectedIcon={editIcon} onSelect={setEditIcon} />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      style={[styles.btn, { flex: 1, backgroundColor: colors.buttonSecondary }]}
                      onPress={cancelEdit}
                    >
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
                /* ── Account row ── */
                <View key={account.id} style={[styles.accountRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.accountIconWrap, { backgroundColor: PRIMARY + "18" }]}>
                    <CategoryIcon icon={account.icon ?? "piggy-bank"} size={20} color={PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(accountStatsById.get(account.id)?.balance ?? 0)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => startEdit(account)}
                    style={styles.accountEditBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil" size={15} color={colors.muted} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(account)}
                    style={[styles.accountEditBtn, { marginLeft: 4 }]}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
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

function IconPicker({ selectedIcon, onSelect }: { selectedIcon: string; onSelect: (icon: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {ACCOUNT_ICONS.map((icon) => (
          <Pressable
            key={icon}
            onPress={() => onSelect(icon)}
            style={[styles.iconChip, selectedIcon === icon && styles.iconChipActive]}
          >
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
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
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
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  accountIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  accountBalance: {
    color: "#606070",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  accountEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});

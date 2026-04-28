import { Text } from "@/components/text";
import { CARD_THEMES, getCardTheme } from "@/constants/card-themes";
import { BACKGROUND_IMAGES, getBackgroundImage } from "@/constants/background-images";
import { useAccount } from "@/context/account";
import { useAuth } from "@/context/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image } from "expo-image";
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_W = Dimensions.get("window").width;
const PREVIEW_W = SCREEN_W - 48;
const CIRCLE_SIZE = 56;
const THUMB_W = 64;
const THUMB_H = 96;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CustomizeProfileScreen() {
  const router = useRouter();
  const { activeAccount, updateAccount } = useAccount();
  const { userProfile, user, updateUserProfile } = useAuth();

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    activeAccount?.themeId ?? CARD_THEMES[0].id,
  );
  const [selectedBgId, setSelectedBgId] = useState<string>(
    userProfile?.backgroundImageId ?? "none",
  );
  const [saving, setSaving] = useState(false);

  const firstName = user?.displayName?.split(" ")[0] ?? "Usuario";
  const code = userProfile?.currencyCode ?? "EUR";

  const previewTheme = getCardTheme(selectedThemeId);
  const previewBg = previewTheme.bgColor;

  // Image mode = any non-"none" image selected
  const isImageMode = selectedBgId !== "none";

  const hasThemeChanged = selectedThemeId !== (activeAccount?.themeId ?? CARD_THEMES[0].id);
  const hasBgChanged = selectedBgId !== (userProfile?.backgroundImageId ?? "none");

  const handleApply = async () => {
    if (!activeAccount) { router.back(); return; }
    if (!hasThemeChanged && !hasBgChanged) { router.back(); return; }
    setSaving(true);
    try {
      const tasks: Promise<any>[] = [];
      if (hasThemeChanged) tasks.push(updateAccount(activeAccount.id, { themeId: selectedThemeId }));
      if (hasBgChanged) tasks.push(updateUserProfile({ backgroundImageId: selectedBgId === "none" ? null : selectedBgId }));
      await Promise.all(tasks);
    } finally {
      setSaving(false);
      router.back();
    }
  };

  const selectedBgSource = isImageMode ? getBackgroundImage(selectedBgId).source : null;

  return (
    <View style={styles.root}>
      {/* ── Live background preview ── */}
      <LinearGradient
        colors={[hexToRgba(previewBg, 0.60), hexToRgba(previewBg, 0.18), "transparent"]}
        locations={[0, 0.45, 0.78]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* ── Header ── */}
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <Text style={styles.title}>Personalizar perfil</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── App preview mockup ── */}
        <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.previewWrap}>
          <View style={[styles.previewFrame, { width: PREVIEW_W }]}>
            {/* Exclusive backgrounds: image OR color gradient */}
            {isImageMode && selectedBgSource ? (
              <>
                <Image source={selectedBgSource} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient
                  colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0)", "rgba(0,0,0,0.90)", "#090909", "#090909"]}
                  locations={[0, 0.30, 0.55, 0.68, 1]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
              </>
            ) : (
              <LinearGradient
                colors={[hexToRgba(previewBg, 0.75), hexToRgba(previewBg, 0.25), "#090909"]}
                locations={[0, 0.45, 0.85]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            )}

            {/* Mini header row */}
            <View style={styles.mockHeader}>
              <View style={styles.mockAvatar} />
              <View style={styles.mockSearchBar} />
              <View style={styles.mockIconBtn} />
              <View style={styles.mockIconBtn} />
            </View>

            {/* Account info */}
            <View style={styles.mockAccount}>
              <Text style={styles.mockAccountLabel}>
                {activeAccount?.name ?? "Mi cuenta"} · {code}
              </Text>
              <View style={styles.mockBalanceRow}>
                <Text style={styles.mockBalanceSymbol}>€</Text>
                <Text style={styles.mockBalanceInt}>2.420</Text>
                <Text style={styles.mockBalanceCents}>.39</Text>
              </View>
              <View style={styles.mockAccountsBtn}>
                <Text style={styles.mockAccountsBtnText}>Cuentas</Text>
              </View>
              <View style={styles.mockDots}>
                <View style={[styles.mockDot, styles.mockDotActive]} />
                <View style={styles.mockDot} />
                <View style={styles.mockDot} />
              </View>
            </View>

            {/* Quick buttons mock */}
            <View style={styles.mockButtons}>
              {["Ingreso", "Gasto", "Objetivo", "Más"].map((label) => (
                <View key={label} style={styles.mockBtn}>
                  <View style={styles.mockBtnIcon} />
                  <Text style={styles.mockBtnLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Color picker — dimmed when image is active ── */}
        <Animated.View
          entering={FadeIn.duration(300).delay(150)}
          style={[styles.pickerSection, isImageMode && styles.pickerDimmed]}
          pointerEvents={isImageMode ? "none" : "auto"}
        >
          <Text style={styles.pickerLabel}>Color de fondo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.circlesRow}
          >
            {CARD_THEMES.map((theme) => {
              const isSelected = theme.id === selectedThemeId;
              return (
                <Pressable
                  key={theme.id}
                  onPress={() => {
                    setSelectedThemeId(theme.id);
                    setSelectedBgId("none");
                  }}
                  style={styles.circleWrap}
                >
                  <View style={[styles.circleRing, isSelected && styles.circleRingSelected]}>
                    <View style={[styles.circle, { backgroundColor: theme.bgColor }]} />
                  </View>
                  <Text style={[styles.circleName, isSelected && styles.circleNameSelected]} numberOfLines={1}>
                    {theme.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Separator */}
        <View style={styles.sectionSeparator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>o</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* ── Background image picker — dimmed when color is active ── */}
        <Animated.View
          entering={FadeIn.duration(300).delay(220)}
          style={[styles.pickerSection, !isImageMode && selectedBgId === "none" && styles.pickerDimmedLight]}
        >
          <Text style={styles.pickerLabel}>Imagen de fondo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbsRow}
          >
            {BACKGROUND_IMAGES.map((bg) => {
              const isSelected = bg.id === selectedBgId;
              return (
                <Pressable
                  key={bg.id}
                  onPress={() => setSelectedBgId(bg.id)}
                  style={styles.thumbWrap}
                >
                  <View style={[styles.thumbRing, isSelected && styles.thumbRingSelected]}>
                    <View style={styles.thumb}>
                      {bg.source ? (
                        <Image
                          source={bg.source}
                          style={{ width: THUMB_W, height: THUMB_H }}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.thumbNone}>
                          <Ionicons name="close" size={20} color="rgba(255,255,255,0.35)" />
                        </View>
                      )}
                      {isSelected && bg.source && (
                        <View style={styles.thumbCheckOverlay}>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[styles.circleName, isSelected && styles.circleNameSelected]} numberOfLines={1}>
                    {bg.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </ScrollView>

      {/* ── Apply button ── */}
      <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
        <Pressable
          style={[styles.applyBtn, saving && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={saving}
        >
          <Text style={styles.applyBtnText}>{saving ? "Guardando…" : "Aplicar"}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090909",
  },
  safeTop: {
    backgroundColor: "transparent",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  // ── Scroll ──
  scroll: {
    paddingBottom: 24,
  },

  // ── Preview mockup ──
  previewWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  previewFrame: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  mockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mockAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  mockSearchBar: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  mockIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  mockAccount: {
    alignItems: "center",
    paddingVertical: 20,
  },
  mockAccountLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 8,
  },
  mockBalanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  mockBalanceSymbol: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 38,
  },
  mockBalanceInt: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  mockBalanceCents: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 2,
  },
  mockAccountsBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 10,
  },
  mockAccountsBtnText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 11,
    fontWeight: "600",
  },
  mockDots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  mockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  mockDotActive: {
    backgroundColor: "rgba(255,255,255,0.80)",
  },
  mockButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  mockBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mockBtnIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.30)",
  },
  mockBtnLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "500",
  },

  // ── Section separator ──
  sectionSeparator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginVertical: 24,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  separatorText: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Picker shared ──
  pickerSection: {
    paddingHorizontal: 24,
  },
  pickerDimmed: {
    opacity: 0.30,
  },
  pickerDimmedLight: {
    opacity: 0.65,
  },
  pickerLabel: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  // ── Color circles ──
  circlesRow: {
    gap: 20,
    paddingRight: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  circleWrap: {
    alignItems: "center",
    gap: 8,
    width: CIRCLE_SIZE + 4,
  },
  circleRing: {
    width: CIRCLE_SIZE + 4,
    height: CIRCLE_SIZE + 4,
    borderRadius: (CIRCLE_SIZE + 4) / 2,
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  circleRingSelected: {
    borderColor: "#FFFFFF",
  },
  circle: {
    flex: 1,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleName: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  circleNameSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ── Background image thumbnails ──
  thumbsRow: {
    gap: 10,
    paddingRight: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumbWrap: {
    alignItems: "center",
    gap: 8,
    width: THUMB_W + 8,
  },
  thumbRing: {
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbRingSelected: {
    borderColor: "#FFFFFF",
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbNone: {
    width: THUMB_W,
    height: THUMB_H,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbCheckOverlay: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },

  // ── Apply button ──
  footerSafe: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "transparent",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  applyBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  applyBtnDisabled: {
    opacity: 0.55,
  },
  applyBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

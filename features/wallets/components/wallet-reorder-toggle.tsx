import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  walletsPalette,
  walletsStyles as styles,
} from "../styles/wallets.styles";

export interface WalletReorderToggleProps {
  reordering: boolean;
  saving: boolean;
  onPress: () => void;
}

/** Pill that enters and leaves the wallet reorder mode. */
export function WalletReorderToggle({
  reordering,
  saving,
  onPress,
}: WalletReorderToggleProps) {
  const { t } = useTranslation("wallets");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        reordering
          ? t("reorder.finishAccessibility")
          : t("reorder.startAccessibility")
      }
      accessibilityState={{ disabled: saving, selected: reordering }}
      disabled={saving}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reorderToggle,
        reordering && styles.reorderToggleActive,
        saving && styles.reorderToggleDisabled,
        pressed && !saving ? styles.reorderTogglePressed : null,
      ]}
    >
      <Ionicons
        name={reordering ? "checkmark" : "swap-vertical"}
        size={16}
        color={reordering ? walletsPalette.onPrimary : walletsPalette.primary}
        accessible={false}
      />
      <ThemedText
        style={[
          styles.reorderToggleText,
          reordering && styles.reorderToggleTextActive,
        ]}
      >
        {reordering ? t("reorder.finish") : t("reorder.start")}
      </ThemedText>
    </Pressable>
  );
}

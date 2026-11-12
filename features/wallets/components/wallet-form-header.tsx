import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletFormStyles as styles } from "../styles/wallet-form.styles";

export interface WalletFormHeaderProps {
  mode?: "create" | "edit";
  disabled: boolean;
  onClose: () => void;
}

export function WalletFormHeader({
  mode = "create",
  disabled,
  onClose,
}: WalletFormHeaderProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "common"]);
  const isEditing = mode === "edit";

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? t("form.editTitle") : t("form.createTitle")}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
          {isEditing ? t("form.editSubtitle") : t("form.createSubtitle")}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common:accessibility.closeForm")}
        hitSlop={10}
        onPress={onClose}
        disabled={disabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color={theme.muted} />
      </Pressable>
    </View>
  );
}

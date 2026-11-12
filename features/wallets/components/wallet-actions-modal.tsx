import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import { Wallet } from "../types/wallet.types";
import { isWalletArchived } from "../utils/wallet-status";

export interface WalletActionsModalProps {
  wallet: Wallet | null;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function WalletActionsModal({
  wallet,
  onEdit,
  onToggleArchive,
  onDelete,
  onClose,
}: WalletActionsModalProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["wallets", "common"]);
  const locale = useAppLocale();

  if (!wallet) return null;

  const archived = isWalletArchived(wallet);
  const archiveLabel = archived ? t("actions.restore") : t("actions.archive");

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t("actions.close")}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <ThemedText type="title" style={styles.sheetTitle}>
            {wallet.name}
          </ThemedText>
          <ThemedText style={[styles.sheetSubtitle, { color: theme.muted }]}>
            {archived ? t("actions.archived") : t("actions.active")} ·{" "}
            {locale.formatCurrency(wallet.balance, wallet.currency)}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("actions.edit")}
            onPress={onEdit}
            style={[styles.actionButton, { borderColor: theme.border }]}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.primary} />
            <ThemedText style={styles.actionText}>
              {t("actions.edit")}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={archiveLabel}
            onPress={onToggleArchive}
            style={[styles.actionButton, { borderColor: theme.border }]}
          >
            <Ionicons
              name={archived ? "arrow-undo-outline" : "archive-outline"}
              size={20}
              color={theme.primary}
            />
            <ThemedText style={styles.actionText}>{archiveLabel}</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("actions.delete")}
            onPress={onDelete}
            style={[
              styles.actionButton,
              { borderColor: theme.danger, backgroundColor: theme.dangerSurface },
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
            <ThemedText style={[styles.actionText, { color: theme.dangerText }]}>
              {t("actions.delete")}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("actions.cancel")}
            onPress={onClose}
            style={styles.cancelButton}
          >
            <ThemedText type="defaultSemiBold" style={{ color: theme.muted }}>
              {t("common:actions.cancel")}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { settlementsStyles as styles } from "../styles/settlements.styles";
import type { SettlementViewerDetail } from "../utils/settlement-detail";

export interface SettlementDetailWalletProps {
  detail: SettlementViewerDetail;
  walletName: string | null;
  walletArchived: boolean;
  pending: boolean;
  /** Opens the edit modal, where the creditor picks the wallet. */
  onLink: () => void;
  onUnlink: () => void;
}

/**
 * Creditor follow-up of the notification: link a wallet from the edit form or
 * remove the existing one. The debtor never sees this block, and an archived
 * linked wallet keeps its remove action.
 */
export function SettlementDetailWallet({
  detail,
  walletName,
  walletArchived,
  pending,
  onLink,
  onUnlink,
}: SettlementDetailWalletProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("settlements");

  if (!detail.viewerIsCreditor || !detail.isActive) return null;

  if (!detail.hasReceiverWallet) {
    return (
      <View style={styles.detailBlock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.linkWallet")}
          accessibilityHint={t("detail.linkWalletHint")}
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onLink}
          style={({ pressed }) => [
            styles.linkButton,
            { backgroundColor: theme.primary },
            pending && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.linkButtonText, { color: theme.onPrimary }]}>
            {t("detail.linkWallet")}
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.detailBlock}>
      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("detail.receiverWallet")}
      </ThemedText>
      <View style={styles.detailWalletRow}>
        <ThemedText style={[styles.detailValue, { color: theme.text }]}>
          {walletName ?? t("detail.walletUnavailable")}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detail.unlinkWallet")}
          accessibilityHint={t("detail.unlinkWalletHint")}
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onUnlink}
          style={({ pressed }) => [
            styles.detailAction,
            pending && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.detailActionText, { color: theme.primary }]}>
            {t("detail.unlinkWallet")}
          </ThemedText>
        </Pressable>
      </View>
      {walletArchived ? (
        <ThemedText style={[styles.helper, { color: theme.warning }]}>
          {t("detail.walletArchived")}
        </ThemedText>
      ) : null}
    </View>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { walletManagementStyles as styles } from "../styles/wallet-management.styles";
import {
  DeleteWalletOptions,
  Wallet,
  WalletDeleteMode,
  WalletUsage,
} from "../types/wallet.types";
import { getDeletedWalletName } from "../utils/deleted-wallet";
import { isWalletActive } from "../utils/wallet-status";
import { WalletDeleteFooter } from "./wallet-delete-footer";
import { WalletDeleteOptions as DeleteOptions } from "./wallet-delete-options";

export interface WalletDeleteModalProps {
  wallet: Wallet | null;
  usage: WalletUsage | null;
  wallets: readonly Wallet[];
  submitting: boolean;
  error: string | null;
  onConfirm: (options: DeleteWalletOptions) => void;
  onClose: () => void;
}

/** Permanent deletion with keep-or-reassign handling for existing movements. */
export function WalletDeleteModal({
  wallet,
  usage,
  wallets,
  submitting,
  error,
  onConfirm,
  onClose,
}: WalletDeleteModalProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("wallets");
  const [mode, setMode] = useState<WalletDeleteMode>("keep");
  const [targetWalletId, setTargetWalletId] = useState<string | null>(null);

  const walletId = wallet?.id ?? "";

  useEffect(() => {
    setMode("keep");
    setTargetWalletId(null);
  }, [walletId]);

  const targets = useMemo(
    () =>
      wallets.filter(
        (candidate) =>
          candidate.id !== wallet?.id &&
          candidate.currency === wallet?.currency &&
          isWalletActive(candidate),
      ),
    [wallets, wallet?.id, wallet?.currency],
  );

  if (!wallet) return null;

  const hasMovements = usage?.hasMovements ?? false;
  const usageLoading = usage === null;
  const needsTarget = hasMovements && mode === "reassign";
  const disabled =
    submitting || usageLoading || (needsTarget && targetWalletId === null);

  function selectMode(nextMode: WalletDeleteMode) {
    setMode(nextMode);
    if (nextMode === "keep") setTargetWalletId(null);
  }

  function confirm() {
    if (disabled) return;

    onConfirm({
      mode: hasMovements ? mode : "keep",
      targetWalletId: needsTarget ? targetWalletId ?? undefined : undefined,
    });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t("delete.close")}
          onPress={submitting ? undefined : onClose}
        />
        <View
          style={[
            styles.deleteSheet,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <ThemedText type="title" style={styles.sheetTitle}>
            {t("delete.title")}
          </ThemedText>
          <ThemedText style={[styles.deleteMessage, { color: theme.muted }]}>
            {usageLoading
              ? t("delete.checking", { name: wallet.name })
              : hasMovements
                ? t("delete.hasMovements", { name: wallet.name })
                : t("delete.noMovements", { name: wallet.name })}
          </ThemedText>

          {usageLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.primary} />
              <ThemedText style={[styles.optionHint, { color: theme.muted }]}>
                {t("delete.checkingShort")}
              </ThemedText>
            </View>
          ) : null}

          {hasMovements ? (
            <DeleteOptions
              targets={targets}
              mode={mode}
              targetWalletId={targetWalletId}
              deletedName={getDeletedWalletName(wallet.name)}
              submitting={submitting}
              onModeChange={selectMode}
              onTargetChange={setTargetWalletId}
            />
          ) : null}

          <WalletDeleteFooter
            error={error}
            submitting={submitting}
            disabled={disabled}
            onConfirm={confirm}
            onClose={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

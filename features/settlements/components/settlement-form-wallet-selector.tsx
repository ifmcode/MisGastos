import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { WalletChipSelector } from "@/features/wallets/components/wallet-chip-selector";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { isWalletArchived } from "@/features/wallets/utils/wallet-status";
import type { CurrencyCode } from "@/shared/constants/currencies";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SettlementValidationCode } from "../schemas/settlement-validation.types";
import { settlementsStyles as styles } from "../styles/settlements.styles";
import { getSettlementWalletChoices } from "../utils/settlement-form-options";

export interface SettlementFormWalletSelectorProps {
  wallets: readonly Wallet[];
  currency: CurrencyCode;
  selectedId: string;
  disabled: boolean;
  error?: SettlementValidationCode;
  onChange: (walletId: string) => void;
}

/**
 * Optional income wallet. "No wallet" stays selected by default; only active
 * same-currency wallets can be linked, while an already linked archived wallet
 * remains visible (and removable) instead of disappearing silently.
 */
export function SettlementFormWalletSelector({
  wallets,
  currency,
  selectedId,
  disabled,
  error,
  onChange,
}: SettlementFormWalletSelectorProps) {
  const theme = useFormTheme();
  const { t, tr } = useScopedTranslation("settlements");
  const [pickerVisible, setPickerVisible] = useState(false);
  const walletId = selectedId.trim();
  const choices = useMemo(
    () => getSettlementWalletChoices(wallets, currency, walletId),
    [currency, walletId, wallets],
  );
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const archived = selectedWallet ? isWalletArchived(selectedWallet) : false;
  const noWallet = walletId.length === 0;

  function select(id: string) {
    onChange(id);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={styles.label}>{t("form.walletLabel")}</ThemedText>
      <View
        style={styles.chipRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("form.walletGroupAccessibility")}
      >
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: noWallet, disabled }}
          accessibilityLabel={t("form.walletNoneAccessibility")}
          disabled={disabled}
          onPress={() => select("")}
          style={({ pressed }) => [
            styles.optionChip,
            {
              backgroundColor: noWallet ? theme.primarySoft : theme.surface,
              borderColor: noWallet ? theme.primary : theme.border,
            },
            disabled && styles.optionChipDisabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText
            style={[
              styles.optionChipText,
              { color: noWallet ? theme.primary : theme.text },
            ]}
          >
            {t("form.walletNone")}
          </ThemedText>
        </Pressable>
      </View>

      {choices.length === 0 ? (
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("form.walletEmpty", { currency })}
        </ThemedText>
      ) : null}

      <View style={styles.walletPicker}>
        <WalletChipSelector
          wallets={choices}
          selectedId={walletId}
          disabled={disabled}
          accessibilityPrefix={t("form.walletChipAccessibility", {
            name: "",
          }).trim()}
          onSelect={select}
          onOpenPicker={() => setPickerVisible(true)}
        />
      </View>

      <ThemedText style={[styles.helper, { color: theme.muted }]}>
        {t("form.walletHint")}
      </ThemedText>

      {archived ? (
        <ThemedText style={[styles.fieldError, { color: theme.warning }]}>
          {t("form.walletArchivedHint")}
        </ThemedText>
      ) : null}

      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {tr(`errors.${error}`)}
        </ThemedText>
      ) : null}

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={choices}
        selectedId={walletId}
        disabled={disabled}
        accessibilityPrefix={t("form.walletChipAccessibility", {
          name: "",
        }).trim()}
        onSelect={select}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

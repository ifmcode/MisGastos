import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { WalletChipSelector } from "@/features/wallets/components/wallet-chip-selector";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { linkedMovementStyles as styles } from "../styles/shared-expense-linked-movement.styles";
import { sharedExpensesStyles } from "../styles/shared-expenses.styles";

export interface SharedExpenseWalletFieldProps {
  /** Filtered wallets; the stored one is included even when archived. */
  wallets: readonly Wallet[];
  selectedId: string;
  disabled: boolean;
  /** Translated wallet error, already resolved from its validation code. */
  errorText?: string | null;
  /** Translated guidance shown when the currency has no active wallets. */
  emptyText: string;
  onSelect: (walletId: string) => void;
}

/**
 * Wallet of the linked movement while the viewer registers the expense in one.
 * The block only renders when the registration toggle is **Yes** and the viewer
 * is the payer; a social-only expense never shows it.
 */
export function SharedExpenseWalletField({
  wallets,
  selectedId,
  disabled,
  errorText,
  emptyText,
  onSelect,
}: SharedExpenseWalletFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);
  const hasOptions = wallets.length > 0;

  function select(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={sharedExpensesStyles.label}>
        {t("form.walletLabel")}
      </ThemedText>

      {hasOptions ? (
        <View
          style={styles.group}
          accessibilityRole="radiogroup"
          accessibilityLabel={t("form.walletGroupAccessibility")}
        >
          <WalletChipSelector
            wallets={wallets}
            selectedId={selectedId}
            disabled={disabled}
            accessibilityPrefix={t("form.walletAccessibilityPrefix")}
            onSelect={onSelect}
            onOpenPicker={() => setPickerVisible(true)}
          />
        </View>
      ) : (
        <View style={styles.group}>
          <ThemedText
            style={[sharedExpensesStyles.helper, { color: theme.muted }]}
          >
            {emptyText}
          </ThemedText>
        </View>
      )}

      {hasOptions ? (
        <ThemedText style={[sharedExpensesStyles.helper, { color: theme.muted }]}>
          {t("form.walletHint")}
        </ThemedText>
      ) : null}

      {errorText ? (
        <ThemedText
          style={[sharedExpensesStyles.fieldError, { color: theme.danger }]}
        >
          {errorText}
        </ThemedText>
      ) : null}

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={wallets}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix={t("form.walletAccessibilityPrefix")}
        onSelect={select}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

import { useState } from "react";
import { Pressable, View } from "react-native";

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
  onSelect: (walletId: string) => void;
}

/** Optional wallet of the linked movement, with an explicit "no wallet" chip. */
export function SharedExpenseWalletField({
  wallets,
  selectedId,
  disabled,
  onSelect,
}: SharedExpenseWalletFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");
  const [pickerVisible, setPickerVisible] = useState(false);
  const noWalletSelected = selectedId.length === 0;

  function select(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <View>
      <ThemedText style={sharedExpensesStyles.label}>
        {t("form.walletLabel")}
      </ThemedText>

      <View
        style={styles.group}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("form.walletGroupAccessibility")}
      >
        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: noWalletSelected }}
            accessibilityLabel={t("form.walletNoneAccessibility")}
            accessibilityHint={t("form.walletNoneHint")}
            onPress={() => select("")}
            disabled={disabled}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: noWalletSelected
                  ? theme.primarySoft
                  : theme.surface,
                borderColor: noWalletSelected ? theme.primary : theme.border,
              },
              pressed && styles.pickerOptionPressed,
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: noWalletSelected ? theme.primary : theme.text },
              ]}
              numberOfLines={1}
            >
              {t("form.walletNone")}
            </ThemedText>
          </Pressable>
        </View>

        {wallets.length > 0 ? (
          <WalletChipSelector
            wallets={wallets}
            selectedId={selectedId}
            disabled={disabled}
            accessibilityPrefix={t("form.walletAccessibilityPrefix")}
            onSelect={onSelect}
            onOpenPicker={() => setPickerVisible(true)}
          />
        ) : null}
      </View>

      <ThemedText style={[sharedExpensesStyles.helper, { color: theme.muted }]}>
        {t("form.walletHint")}
      </ThemedText>

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

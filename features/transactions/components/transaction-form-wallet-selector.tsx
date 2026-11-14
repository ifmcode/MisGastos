import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { WalletChipSelector } from "@/features/wallets/components/wallet-chip-selector";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormWalletSelectorProps {
  wallets: readonly Wallet[];
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (walletId: string) => void;
  onOpenPicker: () => void;
}

export function TransactionFormWalletSelector({
  wallets,
  value,
  error,
  disabled,
  onChange,
  onOpenPicker,
}: TransactionFormWalletSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");

  return (
    <View>
      <ThemedText style={formFieldStyles.label}>{t("form.wallet")}</ThemedText>

      {wallets.length === 0 ? (
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemedText style={[styles.infoText, { color: theme.muted }]}>
            {t("form.noWallets")}
          </ThemedText>
        </View>
      ) : null}

      <WalletChipSelector
        wallets={wallets}
        selectedId={value}
        disabled={disabled}
        accessibilityPrefix={t("form.wallet")}
        onSelect={onChange}
        onOpenPicker={onOpenPicker}
      />

      {error ? (
        <ThemedText style={[formFieldStyles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

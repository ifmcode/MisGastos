import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { WalletSelectButton } from "@/features/wallets/components/wallet-select-button";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transactionFormStyles as styles } from "../styles/transaction-form.styles";

export interface TransactionFormWalletSelectorProps {
  wallets: readonly Wallet[];
  value: string;
  error?: string;
  disabled: boolean;
  onOpenPicker: () => void;
}

export function TransactionFormWalletSelector({
  wallets,
  value,
  error,
  disabled,
  onOpenPicker,
}: TransactionFormWalletSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transactions");
  const selectedWallet = wallets.find((wallet) => wallet.id === value) ?? null;

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

      <WalletSelectButton
        wallet={selectedWallet}
        disabled={disabled}
        hasError={Boolean(error)}
        accessibilityPrefix={t("form.wallet")}
        onPress={onOpenPicker}
      />

      {error ? (
        <ThemedText style={[formFieldStyles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { WalletSelectButton } from "@/features/wallets/components/wallet-select-button";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

export interface TransferFormSourceSelectorProps {
  wallets: Wallet[];
  selectedId: string;
  error?: string;
  disabled: boolean;
  onSelect: (walletId: string) => void;
}

export function TransferFormSourceSelector({
  wallets,
  selectedId,
  error,
  disabled,
  onSelect,
}: TransferFormSourceSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transfers");
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedWallet =
    wallets.find((wallet) => wallet.id === selectedId) ?? null;

  function selectWallet(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <>
      <ThemedText style={formFieldStyles.label}>{t("form.from")}</ThemedText>
      <WalletSelectButton
        wallet={selectedWallet}
        disabled={disabled}
        hasError={Boolean(error)}
        accessibilityPrefix={t("form.from")}
        onPress={() => setPickerVisible(true)}
      />
      {error ? (
        <ThemedText style={[formFieldStyles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={wallets}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix={t("form.from")}
        onSelect={selectWallet}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

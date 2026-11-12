import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { WalletChipSelector } from "@/features/wallets/components/wallet-chip-selector";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";

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
  const [pickerVisible, setPickerVisible] = useState(false);

  function selectWallet(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <>
      <ThemedText style={styles.label}>Desde</ThemedText>
      <WalletChipSelector
        wallets={wallets}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix="Origen"
        onSelect={onSelect}
        onOpenPicker={() => setPickerVisible(true)}
      />
      {error ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : null}

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={wallets}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix="Origen"
        onSelect={selectWallet}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

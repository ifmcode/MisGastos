import { useState } from "react";

import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { TransactionFormWalletSelector } from "./transaction-form-wallet-selector";

export interface TransactionFormWalletFieldProps {
  wallets: readonly Wallet[];
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (walletId: string) => void;
}

/**
 * Compact wallet picker plus its full-wallet popup. The popup state stays with
 * the field so the form only orchestrates the selected value.
 */
export function TransactionFormWalletField({
  wallets,
  value,
  error,
  disabled,
  onChange,
}: TransactionFormWalletFieldProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  function selectWallet(walletId: string) {
    onChange(walletId);
    setPickerVisible(false);
  }

  return (
    <>
      <TransactionFormWalletSelector
        wallets={wallets}
        value={value}
        error={error}
        disabled={disabled}
        onChange={onChange}
        onOpenPicker={() => setPickerVisible(true)}
      />

      <WalletPickerDialog
        visible={pickerVisible}
        wallets={wallets}
        selectedId={value}
        disabled={disabled}
        accessibilityPrefix="Cartera"
        onSelect={selectWallet}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

import { ThemedText } from "@/components/themed-text";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";
import { TransferFormWalletList } from "./transfer-form-wallet-list";

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
  return (
    <>
      <ThemedText style={styles.label}>Desde</ThemedText>
      <TransferFormWalletList
        wallets={wallets}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix="Origen"
        highlightNegativeBalance
        onSelect={onSelect}
      />
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </>
  );
}

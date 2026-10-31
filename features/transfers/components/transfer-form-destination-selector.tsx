import { ThemedText } from "@/components/themed-text";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";
import { TransferFormInfoBanner } from "./transfer-form-info-banner";
import { TransferFormWalletList } from "./transfer-form-wallet-list";

export interface TransferFormDestinationSelectorProps {
  destinations: Wallet[];
  selectedId: string;
  currency: string;
  error?: string;
  disabled: boolean;
  onSelect: (walletId: string) => void;
}

export function TransferFormDestinationSelector({
  destinations,
  selectedId,
  currency,
  error,
  disabled,
  onSelect,
}: TransferFormDestinationSelectorProps) {
  return (
    <>
      <ThemedText style={styles.label}>Hacia</ThemedText>
      {destinations.length === 0 ? (
        <TransferFormInfoBanner
          message={`No hay otra cartera con la moneda ${currency}. Crea una cartera en ${currency} para poder transferir.`}
        />
      ) : (
        <TransferFormWalletList
          wallets={destinations}
          selectedId={selectedId}
          disabled={disabled}
          accessibilityPrefix="Destino"
          onSelect={onSelect}
        />
      )}
      {error ? (
        <ThemedText style={styles.fieldError}>{error}</ThemedText>
      ) : null}
    </>
  );
}

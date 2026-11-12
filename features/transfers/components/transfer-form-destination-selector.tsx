import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { WalletChipSelector } from "@/features/wallets/components/wallet-chip-selector";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { transferFormStyles as styles } from "../styles/transfer-form.styles";
import { TransferFormInfoBanner } from "./transfer-form-info-banner";

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
  const theme = useFormTheme();
  const { t } = useTranslation("transfers");
  const [pickerVisible, setPickerVisible] = useState(false);

  function selectWallet(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <>
      <ThemedText style={styles.label}>{t("form.to")}</ThemedText>
      {destinations.length === 0 ? (
        <TransferFormInfoBanner
          message={t("form.noDestinations", { currency })}
        />
      ) : null}
      <WalletChipSelector
        wallets={destinations}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix={t("form.to")}
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
        wallets={destinations}
        selectedId={selectedId}
        disabled={disabled}
        accessibilityPrefix={t("form.to")}
        onSelect={selectWallet}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}

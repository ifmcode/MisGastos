import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { WalletPickerDialog } from "@/features/wallets/components/wallet-picker-dialog";
import { WalletSelectButton } from "@/features/wallets/components/wallet-select-button";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { formFieldStyles } from "@/shared/components/molecules/form-field.styles";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { TransferFormInfoBanner } from "./transfer-form-info-banner";

export interface TransferFormDestinationSelectorProps {
  destinations: Wallet[];
  selectedId: string;
  currency: string;
  /** A source wallet is required before a destination can be chosen. */
  hasSource: boolean;
  error?: string;
  disabled: boolean;
  onSelect: (walletId: string) => void;
}

export function TransferFormDestinationSelector({
  destinations,
  selectedId,
  currency,
  hasSource,
  error,
  disabled,
  onSelect,
}: TransferFormDestinationSelectorProps) {
  const theme = useFormTheme();
  const { t } = useTranslation("transfers");
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedWallet =
    destinations.find((wallet) => wallet.id === selectedId) ?? null;
  const fieldDisabled = disabled || !hasSource;
  const visibleError = hasSource ? error : undefined;

  function selectWallet(walletId: string) {
    onSelect(walletId);
    setPickerVisible(false);
  }

  return (
    <>
      <ThemedText style={formFieldStyles.label}>{t("form.to")}</ThemedText>
      {hasSource && destinations.length === 0 ? (
        <TransferFormInfoBanner
          message={t("form.noDestinations", { currency })}
        />
      ) : null}
      <WalletSelectButton
        wallet={selectedWallet}
        disabled={fieldDisabled}
        hasError={Boolean(visibleError)}
        accessibilityPrefix={t("form.to")}
        onPress={() => setPickerVisible(true)}
      />
      {visibleError ? (
        <ThemedText style={[formFieldStyles.fieldError, { color: theme.danger }]}>
          {visibleError}
        </ThemedText>
      ) : null}

      <WalletPickerDialog
        visible={pickerVisible && hasSource}
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

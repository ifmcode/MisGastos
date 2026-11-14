import { useTranslation } from "react-i18next";

import {
  CurrencyChipSelector,
  type CurrencyOption,
} from "@/shared/components/molecules/currency-chip-selector";
import { CurrencyCode } from "@/shared/constants/currencies";

export interface WalletFormCurrencySelectorProps {
  value: CurrencyCode;
  disabled: boolean;
  onChange: (currency: CurrencyCode) => void;
}

export function WalletFormCurrencySelector({
  value,
  disabled,
  onChange,
}: WalletFormCurrencySelectorProps) {
  const { t } = useTranslation("wallets");

  function getAccessibilityLabel(currency: CurrencyOption): string {
    return t("types.currencyAccessibility", { name: currency.code });
  }

  return (
    <CurrencyChipSelector
      value={value}
      disabled={disabled}
      getAccessibilityLabel={getAccessibilityLabel}
      onChange={onChange}
    />
  );
}

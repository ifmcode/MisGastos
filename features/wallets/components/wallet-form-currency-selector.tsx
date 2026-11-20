import { useTranslation } from "react-i18next";

import type { CurrencyOption } from "@/shared/components/molecules/currency-chip-selector";
import { CurrencyField } from "@/shared/components/molecules/currency-field";
import type { CurrencyCode } from "@/shared/constants/currencies";

export interface WalletFormCurrencySelectorProps {
  value: CurrencyCode;
  disabled: boolean;
  onChange: (currency: CurrencyCode) => void;
}

/** Standalone wallet currency: the shared compact row plus the picker dialog. */
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
    <CurrencyField
      label={t("form.currency")}
      value={value}
      disabled={disabled}
      changeLabel={t("form.currencyChange")}
      changeAccessibilityLabel={t("form.currencyChangeAccessibility")}
      changeAccessibilityHint={t("form.currencyChangeHint")}
      pickerTitle={t("form.currencyPickerTitle")}
      pickerCloseAccessibilityLabel={t("form.currencyPickerClose")}
      pickerGroupAccessibilityLabel={t("form.currencyGroupAccessibility")}
      getCurrencyAccessibilityLabel={getAccessibilityLabel}
      onChange={onChange}
    />
  );
}

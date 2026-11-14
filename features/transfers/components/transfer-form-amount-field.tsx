import { useTranslation } from "react-i18next";

import { AmountField } from "@/shared/components/molecules/amount-field";

import { type TransferValidationCode } from "../schemas/transfer.schema";

export interface TransferFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: TransferValidationCode;
  helper?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransferFormAmountField({
  value,
  symbol,
  error,
  helper,
  disabled,
  onChange,
}: TransferFormAmountFieldProps) {
  const { t } = useTranslation(["transfers", "validation"]);
  const errorText = error ? t(`validation:transfers.${error}`) : null;

  return (
    <AmountField
      label={t("form.amount")}
      value={value}
      symbol={symbol}
      placeholder={t("form.amountPlaceholder")}
      accessibilityLabel={t("form.amountAccessibility")}
      errorText={errorText}
      helperText={helper}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

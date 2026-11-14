import { useTranslation } from "react-i18next";

import { AmountField } from "@/shared/components/molecules/amount-field";

import { type TransactionValidationCode } from "../schemas/transaction.schema";

export interface TransactionFormAmountFieldProps {
  value: string;
  symbol: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransactionFormAmountField({
  value,
  symbol,
  error,
  disabled,
  onChange,
}: TransactionFormAmountFieldProps) {
  const { t } = useTranslation(["transactions", "validation"]);
  const errorText = error ? t(`validation:transactions.${error}`) : null;

  return (
    <AmountField
      label={t("form.amount")}
      value={value}
      symbol={symbol}
      placeholder={t("form.amountPlaceholder")}
      accessibilityLabel={t("form.amountAccessibility")}
      errorText={errorText}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

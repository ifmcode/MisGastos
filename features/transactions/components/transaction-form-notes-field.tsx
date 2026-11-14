import { useTranslation } from "react-i18next";

import { NotesField } from "@/shared/components/molecules/notes-field";

import {
  TRANSACTION_NOTES_MAX_LENGTH,
  type TransactionValidationCode,
} from "../schemas/transaction.schema";

export interface TransactionFormNotesFieldProps {
  value: string;
  error?: TransactionValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransactionFormNotesField({
  value,
  error,
  disabled,
  onChange,
}: TransactionFormNotesFieldProps) {
  const { t } = useTranslation(["transactions", "validation"]);
  const errorText = error
    ? t(`validation:transactions.${error}`, {
        max: TRANSACTION_NOTES_MAX_LENGTH,
      })
    : null;

  return (
    <NotesField
      label={t("form.notes")}
      value={value}
      placeholder={t("form.notesPlaceholder")}
      accessibilityLabel={t("form.notesAccessibility")}
      maxLength={TRANSACTION_NOTES_MAX_LENGTH}
      errorText={errorText}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

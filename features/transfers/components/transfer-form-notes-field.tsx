import { useTranslation } from "react-i18next";

import { NotesField } from "@/shared/components/molecules/notes-field";

import {
  TRANSFER_NOTES_MAX_LENGTH,
  type TransferValidationCode,
} from "../schemas/transfer.schema";

export interface TransferFormNotesFieldProps {
  value: string;
  error?: TransferValidationCode;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function TransferFormNotesField({
  value,
  error,
  disabled,
  onChange,
}: TransferFormNotesFieldProps) {
  const { t } = useTranslation(["transfers", "validation"]);
  const errorText = error
    ? t(`validation:transfers.${error}`, {
        max: TRANSFER_NOTES_MAX_LENGTH,
      })
    : null;

  return (
    <NotesField
      label={t("form.notes")}
      value={value}
      placeholder={t("form.notesPlaceholder")}
      accessibilityLabel={t("form.notesAccessibility")}
      maxLength={TRANSFER_NOTES_MAX_LENGTH}
      errorText={errorText}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

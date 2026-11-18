import { getCurrencySymbol } from "@/features/wallets/utils/money";
import { AmountField } from "@/shared/components/molecules/amount-field";
import { DateFormField } from "@/shared/components/molecules/date-form-field";
import { NotesField } from "@/shared/components/molecules/notes-field";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { SETTLEMENT_NOTE_MAX_LENGTH } from "../schemas/settlement.schema";
import type { SettlementValidationCode } from "../schemas/settlement-validation.types";
import type {
  SettlementAmountIssue,
  SettlementDateIssue,
  SettlementFormController,
} from "../hooks/use-settlement-form";
import { SettlementFormModeChips } from "./settlement-form-mode-chips";

export interface SettlementFormMainFieldsProps {
  form: SettlementFormController;
  amountLocked: boolean;
  disabled: boolean;
}

/** Mode, amount, date and note of the settlement form. */
export function SettlementFormMainFields({
  form,
  amountLocked,
  disabled,
}: SettlementFormMainFieldsProps) {
  const { t, tr } = useScopedTranslation("settlements");
  const { values, errors, amountIssue } = form;

  function errorText(
    code?: SettlementValidationCode | SettlementAmountIssue | SettlementDateIssue | null,
  ) {
    return code ? tr(`errors.${code}`) : null;
  }

  const amountDisabled =
    disabled || values.mode === "total" || amountLocked;

  return (
    <>
      <SettlementFormModeChips
        mode={values.mode}
        disabled={disabled || amountLocked}
        onChange={form.changeMode}
      />

      <AmountField
        label={t("form.amountLabel")}
        value={values.amount}
        symbol={getCurrencySymbol(values.currency)}
        placeholder={t("form.amountPlaceholder")}
        accessibilityLabel={t("form.amountAccessibility")}
        errorText={errorText(errors.amount ?? amountIssue)}
        helperText={amountLocked ? t("form.amountLocked") : undefined}
        disabled={amountDisabled}
        onChange={form.changeAmount}
      />

      <DateFormField
        label={t("form.dateLabel")}
        text={values.dateText}
        value={values.date}
        error={errorText(errors.date ?? form.dateIssue) ?? undefined}
        helperText={t("form.dateHelper")}
        accessibilityLabel={t("form.dateAccessibility")}
        disabled={disabled}
        onChange={form.changeDateText}
      />

      <NotesField
        label={t("form.noteLabel")}
        value={values.note}
        placeholder={t("form.notePlaceholder")}
        accessibilityLabel={t("form.noteAccessibility")}
        maxLength={SETTLEMENT_NOTE_MAX_LENGTH}
        errorText={errorText(errors.note)}
        disabled={disabled}
        onChange={form.changeNote}
      />
    </>
  );
}

import { getSettlementAmountState } from "@/features/settlements/utils/settlement-amount-status";
import { getCurrencySymbol } from "@/features/wallets/utils/money";
import { AmountField } from "@/shared/components/molecules/amount-field";
import { DateFormField } from "@/shared/components/molecules/date-form-field";
import { NotesField } from "@/shared/components/molecules/notes-field";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupSettlementFormController } from "../hooks/use-group-settlement-form";
import { SETTLEMENT_NOTE_MAX_LENGTH } from "../schemas/group-settlement.schema";

export interface GroupSettlementMainFieldsProps {
  form: GroupSettlementFormController;
  /** True when the creditor already linked the income of this record. */
  amountLocked: boolean;
  disabled: boolean;
}

/**
 * Amount with the live remaining debt, date and note of the group settlement.
 * An amount above the pair debt already shows `AMOUNT_EXCEEDS_DEBT` as the
 * field error, so the live helper never duplicates it.
 */
export function GroupSettlementMainFields({
  form,
  amountLocked,
  disabled,
}: GroupSettlementMainFieldsProps) {
  const { t, tr } = useScopedTranslation("groupExpenses");
  const { formatCurrency } = useAppLocale();
  const { values, errors, amountIssue, dateIssue, boundCents } = form;

  function errorText(code?: string | null) {
    return code ? tr(`errors.${code}`) : null;
  }

  const amountState = amountLocked
    ? null
    : getSettlementAmountState(values.amount, boundCents);
  const liveHelper =
    amountState?.status === "remaining"
      ? t("settlementForm.amountRemaining", {
          amount: formatCurrency(
            amountState.remainingCents / 100,
            values.currency,
          ),
        })
      : amountState?.status === "settled"
        ? t("settlementForm.amountSettled")
        : undefined;

  return (
    <>
      <AmountField
        label={t("settlementForm.amountLabel")}
        value={values.amount}
        symbol={getCurrencySymbol(values.currency)}
        placeholder={t("settlementForm.amountPlaceholder")}
        accessibilityLabel={t("settlementForm.amountAccessibility")}
        errorText={errorText(errors.amount ?? amountIssue)}
        helperText={
          amountLocked ? t("settlementForm.amountLocked") : liveHelper
        }
        helperLive={Boolean(liveHelper)}
        disabled={disabled || amountLocked}
        onChange={form.changeAmount}
      />

      <DateFormField
        label={t("settlementForm.dateLabel")}
        valueIso={values.date}
        error={errorText(errors.date ?? dateIssue) ?? undefined}
        accessibilityLabel={t("settlementForm.dateAccessibility")}
        disabled={disabled}
        onSelectDate={form.selectDate}
      />

      <NotesField
        label={t("settlementForm.noteLabel")}
        value={values.note}
        placeholder={t("settlementForm.notePlaceholder")}
        accessibilityLabel={t("settlementForm.noteAccessibility")}
        maxLength={SETTLEMENT_NOTE_MAX_LENGTH}
        errorText={errorText(errors.note)}
        disabled={disabled}
        onChange={form.changeNote}
      />
    </>
  );
}

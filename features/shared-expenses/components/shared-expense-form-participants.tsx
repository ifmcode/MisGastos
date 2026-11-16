import type { Friend } from "@/features/friends/types/friend.types";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type {
  SharedExpenseFieldErrors,
  SharedExpenseValidationCode,
} from "../schemas/shared-expense.schema";
import type { ExpenseSplitMode } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { getSharedExpenseParticipantName } from "../utils/shared-expense-friends";
import { SharedExpensePayerSelector } from "./shared-expense-payer-selector";
import { SharedExpenseSplitSection } from "./shared-expense-split-section";

export interface SharedExpenseFormParticipantsProps {
  friends: readonly Friend[];
  values: SharedExpenseFormValues;
  errors: SharedExpenseFieldErrors;
  disabled: boolean;
  onPayerChange: (payerId: string) => void;
  onSplitModeChange: (mode: ExpenseSplitMode) => void;
  onSplitValueChange: (userId: string, value: string) => void;
}

/** Payer chips plus the split inputs of the shared-expense form. */
export function SharedExpenseFormParticipants({
  friends,
  values,
  errors,
  disabled,
  onPayerChange,
  onSplitModeChange,
  onSplitValueChange,
}: SharedExpenseFormParticipantsProps) {
  const { t, tr } = useScopedTranslation("sharedExpenses");

  function errorText(code: SharedExpenseValidationCode | undefined) {
    return code ? tr(`errors.${code}`) : null;
  }

  const friendName = getSharedExpenseParticipantName(
    friends,
    values.friendUid,
    t("friendFallback"),
  );

  return (
    <>
      <SharedExpensePayerSelector
        viewerUid={values.viewerUid}
        friendUid={values.friendUid}
        friendName={friendName}
        payerId={values.payerId}
        errorText={errorText(errors.payerId)}
        disabled={disabled}
        onChange={onPayerChange}
      />

      <SharedExpenseSplitSection
        mode={values.splitMode}
        currency={values.currency}
        viewerUid={values.viewerUid}
        friendUid={values.friendUid}
        friendName={friendName}
        values={values.splitValues[values.splitMode]}
        errorText={errorText(errors.participants)}
        modeErrorText={errorText(errors.splitMode)}
        disabled={disabled}
        onModeChange={onSplitModeChange}
        onValueChange={onSplitValueChange}
      />
    </>
  );
}

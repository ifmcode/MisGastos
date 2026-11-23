import type { Wallet } from "@/features/wallets/types/wallet.types";

import {
  toGroupExpenseFieldErrors,
  validateGroupExpenseInput,
  type GroupExpenseFieldErrors,
} from "../schemas/group-expense.schema";
import type { GroupExpenseInput } from "../types/group-expense.types";
import { toGroupExpenseInput } from "../utils/group-expense-form";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import { getGroupExpenseWalletCurrencyError } from "../utils/group-expense-link-values";
import {
  useGroupExpenseFormState,
  type GroupExpenseFormState,
} from "./use-group-expense-form-state";

export interface UseGroupExpenseFormOptions {
  initialValues: GroupExpenseFormValues;
  fieldErrors: GroupExpenseFieldErrors;
  /** Owner wallets, read only to drop a link whose currency no longer matches. */
  wallets: readonly Wallet[];
  onSubmit: (input: GroupExpenseInput) => void;
}

export interface GroupExpenseFormController extends GroupExpenseFormState {
  submit: () => void;
}

/**
 * Owns the group-expense form values. Submit runs the same schema the service
 * would use, scoped to the group member ids, so the inline errors are identical.
 */
export function useGroupExpenseForm({
  initialValues,
  fieldErrors,
  wallets,
  onSubmit,
}: UseGroupExpenseFormOptions): GroupExpenseFormController {
  const state = useGroupExpenseFormState({ initialValues, fieldErrors, wallets });

  function submit() {
    const input = toGroupExpenseInput(state.values);

    // A movements create starts without a group; the schema would report the
    // viewer as a non-member instead of saying a group is missing.
    if (input.groupId.trim().length === 0) {
      state.setValidationErrors({ groupId: "GROUP_REQUIRED" });
      return;
    }

    const validation = validateGroupExpenseInput(
      input,
      state.values.viewerUid,
      state.values.memberIds,
    );

    if (!validation.ok) {
      state.setValidationErrors(toGroupExpenseFieldErrors(validation.error));
      return;
    }

    // The wallet keeps its own currency; checking it here surfaces the same
    // rejection the service would return instead of leaving the tap silent.
    const walletError = getGroupExpenseWalletCurrencyError(
      state.values,
      wallets,
    );

    if (walletError) {
      state.setValidationErrors({ walletId: walletError });
      return;
    }

    state.setValidationErrors({});
    onSubmit(input);
  }

  return { ...state, submit };
}

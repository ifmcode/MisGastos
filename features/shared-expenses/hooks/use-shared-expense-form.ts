import type { Wallet } from "@/features/wallets/types/wallet.types";

import {
  toSharedExpenseFieldErrors,
  validateSharedExpenseInput,
  type SharedExpenseFieldErrors,
} from "../schemas/shared-expense.schema";
import type { SharedExpenseInput } from "../types/shared-expense.types";
import { toSharedExpenseInput } from "../utils/shared-expense-form";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import {
  getSharedExpenseWalletCurrencyError,
} from "../utils/shared-expense-link-values";
import {
  useSharedExpenseFormState,
  type SharedExpenseFormState,
} from "./use-shared-expense-form-state";

export interface UseSharedExpenseFormOptions {
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  /** Owner wallets, read only to drop a link whose currency no longer matches. */
  wallets: readonly Wallet[];
  onSubmit: (input: SharedExpenseInput) => void;
}

export interface SharedExpenseFormController extends SharedExpenseFormState {
  submit: () => void;
}

/** Owns the shared-expense form values; the screen only receives the payload. */
export function useSharedExpenseForm({
  initialValues,
  fieldErrors,
  wallets,
  onSubmit,
}: UseSharedExpenseFormOptions): SharedExpenseFormController {
  const state = useSharedExpenseFormState({
    initialValues,
    fieldErrors,
    wallets,
  });

  function submit() {
    const input = toSharedExpenseInput(state.values);
    const validation = validateSharedExpenseInput(input, state.values.viewerUid);

    if (!validation.ok) {
      state.setValidationErrors(toSharedExpenseFieldErrors(validation.error));
      return;
    }

    // The wallet keeps its own currency; checking it here surfaces the same
    // rejection the service would return instead of leaving the tap silent.
    const walletError = getSharedExpenseWalletCurrencyError(
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

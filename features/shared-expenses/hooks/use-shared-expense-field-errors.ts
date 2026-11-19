import { useState } from "react";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";

export interface SharedExpenseFieldErrorState {
  /** Local validation errors merged with the ones the service returned. */
  errors: SharedExpenseFieldErrors;
  clearError: (...fields: (keyof SharedExpenseFieldErrors)[]) => void;
  setValidationErrors: (errors: SharedExpenseFieldErrors) => void;
}

/** Field errors of the shared-expense form, cleared one field at a time. */
export function useSharedExpenseFieldErrors(
  fieldErrors: SharedExpenseFieldErrors,
): SharedExpenseFieldErrorState {
  const [localErrors, setLocalErrors] = useState<SharedExpenseFieldErrors>({});

  const errors: SharedExpenseFieldErrors = { ...localErrors, ...fieldErrors };

  function clearError(...fields: (keyof SharedExpenseFieldErrors)[]) {
    setLocalErrors((current) => {
      const found = fields.filter((field) => field in current);
      if (found.length === 0) return current;

      const next = { ...current };
      found.forEach((field) => delete next[field]);
      return next;
    });
  }

  return { errors, clearError, setValidationErrors: setLocalErrors };
}

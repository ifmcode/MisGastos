import { useState } from "react";

import type { GroupExpenseFieldErrors } from "../schemas/group-expense.schema";

export interface GroupExpenseFieldErrorState {
  /** Local validation errors merged with the ones the service returned. */
  errors: GroupExpenseFieldErrors;
  clearError: (...fields: (keyof GroupExpenseFieldErrors)[]) => void;
  setValidationErrors: (errors: GroupExpenseFieldErrors) => void;
}

/** Field errors of the group-expense form, cleared one field at a time. */
export function useGroupExpenseFieldErrors(
  fieldErrors: GroupExpenseFieldErrors,
): GroupExpenseFieldErrorState {
  const [localErrors, setLocalErrors] = useState<GroupExpenseFieldErrors>({});

  const errors: GroupExpenseFieldErrors = { ...localErrors, ...fieldErrors };

  function clearError(...fields: (keyof GroupExpenseFieldErrors)[]) {
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

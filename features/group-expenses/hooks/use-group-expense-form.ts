import {
  toGroupExpenseFieldErrors,
  validateGroupExpenseInput,
  type GroupExpenseFieldErrors,
} from "../schemas/group-expense.schema";
import type { GroupExpenseInput } from "../types/group-expense.types";
import { toGroupExpenseInput } from "../utils/group-expense-form";
import type { GroupExpenseFormValues } from "../utils/group-expense-form";
import {
  useGroupExpenseFormState,
  type GroupExpenseFormState,
} from "./use-group-expense-form-state";

export interface UseGroupExpenseFormOptions {
  initialValues: GroupExpenseFormValues;
  fieldErrors: GroupExpenseFieldErrors;
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
  onSubmit,
}: UseGroupExpenseFormOptions): GroupExpenseFormController {
  const state = useGroupExpenseFormState({ initialValues, fieldErrors });

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

    state.setValidationErrors({});
    onSubmit(input);
  }

  return { ...state, submit };
}

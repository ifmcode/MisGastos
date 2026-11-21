import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupExpenseFieldErrors } from "../schemas/group-expense.schema";
import {
  getGroupExpenseErrorCode,
  GroupExpenseValidationError,
} from "../services/group-expense.errors";
import type {
  GroupExpense,
  GroupExpenseInput,
} from "../types/group-expense.types";
import { useGroupExpensesService } from "./use-group-expenses-service";

export interface UseGroupExpenseEditorSubmitOptions {
  viewerUid: string | undefined;
  editingExpense: GroupExpense | null;
  onSaved: () => void;
}

export interface GroupExpenseEditorSubmitState {
  formError: string | null;
  fieldErrors: GroupExpenseFieldErrors;
  submitting: boolean;
  resetErrors: () => void;
  submit: (input: GroupExpenseInput) => void;
}

/** Persists a group expense and maps its failure codes to form errors. */
export function useGroupExpenseEditorSubmit({
  viewerUid,
  editingExpense,
  onSaved,
}: UseGroupExpenseEditorSubmitOptions): GroupExpenseEditorSubmitState {
  const service = useGroupExpensesService();
  const { tr } = useScopedTranslation("groupExpenses");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<GroupExpenseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(
    (input: GroupExpenseInput) => {
      if (!viewerUid) {
        setFormError(tr("errors.SIGN_IN_REQUIRED"));
        return;
      }

      const persist = async () => {
        setSubmitting(true);
        setFormError(null);
        setFieldErrors({});

        try {
          if (editingExpense) {
            await service.updateGroupExpense(
              viewerUid,
              editingExpense.id,
              input,
            );
          } else {
            await service.createGroupExpense(viewerUid, input);
          }

          onSaved();
        } catch (error: unknown) {
          if (error instanceof GroupExpenseValidationError) {
            setFieldErrors(error.fieldErrors);
          }
          setFormError(
            tr(`errors.${getGroupExpenseErrorCode(error, "SAVE_FAILED")}`),
          );
        } finally {
          setSubmitting(false);
        }
      };

      void persist();
    },
    [editingExpense, onSaved, service, tr, viewerUid],
  );

  return { formError, fieldErrors, submitting, resetErrors, submit };
}

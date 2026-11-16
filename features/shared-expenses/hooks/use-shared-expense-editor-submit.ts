import { useCallback, useState } from "react";

import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import {
  getSharedExpenseErrorCode,
  SharedExpenseValidationError,
} from "../services/shared-expense.errors";
import type {
  SharedExpense,
  SharedExpenseInput,
} from "../types/shared-expense.types";
import { useSharedExpensesService } from "./use-shared-expenses-service";

export interface UseSharedExpenseEditorSubmitOptions {
  viewerUid: string | undefined;
  editingExpense: SharedExpense | null;
  /** Reloaded after a save: the wallet balance and the ensured category moved. */
  onResourcesChanged: () => void;
  onSaved: () => void;
}

export interface SharedExpenseEditorSubmitState {
  formError: string | null;
  fieldErrors: SharedExpenseFieldErrors;
  submitting: boolean;
  resetErrors: () => void;
  submit: (input: SharedExpenseInput) => void;
}

/** Persists a shared expense and maps its failure codes to form errors. */
export function useSharedExpenseEditorSubmit({
  viewerUid,
  editingExpense,
  onResourcesChanged,
  onSaved,
}: UseSharedExpenseEditorSubmitOptions): SharedExpenseEditorSubmitState {
  const service = useSharedExpensesService();
  const { tr } = useScopedTranslation("sharedExpenses");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SharedExpenseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetErrors = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
  }, []);

  const submit = useCallback(
    (input: SharedExpenseInput) => {
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
            await service.updateExpense(viewerUid, editingExpense.id, input);
          } else {
            await service.createExpense(viewerUid, input);
          }

          onResourcesChanged();
          onSaved();
        } catch (error: unknown) {
          if (error instanceof SharedExpenseValidationError) {
            setFieldErrors(error.fieldErrors);
          }
          setFormError(
            tr(`errors.${getSharedExpenseErrorCode(error, "SAVE_FAILED")}`),
          );
        } finally {
          setSubmitting(false);
        }
      };

      void persist();
    },
    [editingExpense, onResourcesChanged, onSaved, service, tr, viewerUid],
  );

  return { formError, fieldErrors, submitting, resetErrors, submit };
}

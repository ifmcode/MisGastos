import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import {
  CategoryInput,
  CategoryValidationErrors,
} from "../schemas/category.schema";
import {
  CategoryValidationError,
  getCategoryErrorCode,
} from "../services/category.errors";
import { Category, CategoryType } from "../types/category.types";
import { useCategoryService } from "./use-category-service";

export interface UseCategoryCreatorResult {
  visible: boolean;
  defaultType: CategoryType;
  submitting: boolean;
  error: string | null;
  fieldErrors: CategoryValidationErrors;
  open: (type: CategoryType) => void;
  close: () => void;
  create: (input: CategoryInput) => Promise<Category | null>;
}

/**
 * Owns the inline "create category" modal used from the transaction form.
 * Returns the created category so the caller can select it immediately.
 */
export function useCategoryCreator(): UseCategoryCreatorResult {
  const { user } = useAuth();
  const { t, tr } = useScopedTranslation("categories");
  const categoryService = useCategoryService();

  const [visible, setVisible] = useState(false);
  const [defaultType, setDefaultType] = useState<CategoryType>("expense");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CategoryValidationErrors>({});

  const open = useCallback((type: CategoryType) => {
    setDefaultType(type);
    setError(null);
    setFieldErrors({});
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setError(null);
    setFieldErrors({});
  }, []);

  const create = useCallback(
    async (input: CategoryInput): Promise<Category | null> => {
      if (!user) {
        setError(t("errors.SIGN_IN_CREATE"));
        return null;
      }

      setSubmitting(true);
      setError(null);
      setFieldErrors({});

      try {
        return await categoryService.createCategory(user.uid, input);
      } catch (failure: unknown) {
        if (failure instanceof CategoryValidationError) {
          setFieldErrors(failure.fieldErrors);
          setError(t("errors.VALIDATION"));
        } else {
          setError(
            tr(`errors.${getCategoryErrorCode(failure, "CREATE_FAILED")}`),
          );
        }

        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [user, categoryService, t, tr],
  );

  return {
    visible,
    defaultType,
    submitting,
    error,
    fieldErrors,
    open,
    close,
    create,
  };
}

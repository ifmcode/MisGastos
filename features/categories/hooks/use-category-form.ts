import { useState } from "react";

import {
  CategoryInput,
  CategoryValidationErrors,
  toCategoryFieldErrors,
  validateCategoryInput,
} from "../schemas/category.schema";
import { CategoryFormValues } from "../types/category.types";

export interface UseCategoryFormOptions {
  initialValues: CategoryFormValues;
  fieldErrors: CategoryValidationErrors;
  onSubmit: (input: CategoryInput) => void;
}

export interface UseCategoryFormResult {
  values: CategoryFormValues;
  errors: CategoryValidationErrors;
  updateValue: <K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) => void;
  submit: () => void;
}

/** Owns the category form values, validation and submit flow. */
export function useCategoryForm({
  initialValues,
  fieldErrors,
  onSubmit,
}: UseCategoryFormOptions): UseCategoryFormResult {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<CategoryValidationErrors>({});

  const errors: CategoryValidationErrors = { ...localErrors, ...fieldErrors };

  function updateValue<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function submit() {
    const validation = validateCategoryInput(values);

    if (!validation.ok) {
      setLocalErrors(toCategoryFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
  }

  return { values, errors, updateValue, submit };
}

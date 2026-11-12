import { Result } from "@/shared/types/common.types";

import { CategoryType, CreateCategoryDto } from "../types/category.types";
import { getCategoryIssues } from "./category-field-validation";
import {
  CategoryInput,
  CategoryValidationErrors,
  CategoryValidationIssue,
} from "./category-validation.types";

export {
  CATEGORY_NAME_MAX_LENGTH,
  type CategoryFormField,
  type CategoryInput,
  type CategoryValidationCode,
  type CategoryValidationErrors,
  type CategoryValidationIssue,
} from "./category-validation.types";

export function validateCategoryInput(
  input: CategoryInput,
): Result<CreateCategoryDto, CategoryValidationIssue[]> {
  const issues = getCategoryIssues(input);

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      name: input.name.trim(),
      icon: input.icon,
      color: input.color.toUpperCase(),
      type: input.type as CategoryType,
    },
  };
}

export function toCategoryFieldErrors(
  issues: readonly CategoryValidationIssue[],
): CategoryValidationErrors {
  return issues.reduce<CategoryValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.code;
    }
    return errors;
  }, {});
}

import {
  isCategoryIcon,
  isCategoryType,
} from "../utils/category-options";
import {
  CATEGORY_NAME_MAX_LENGTH,
  CategoryInput,
  CategoryValidationIssue,
} from "./category-validation.types";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function getNameIssue(input: CategoryInput): CategoryValidationIssue | null {
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (name.length === 0) {
    return { field: "name", code: "NAME_REQUIRED" };
  }

  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return { field: "name", code: "NAME_TOO_LONG" };
  }

  return null;
}

function getIconIssue(input: CategoryInput): CategoryValidationIssue | null {
  if (isCategoryIcon(input.icon)) return null;

  return { field: "icon", code: "INVALID_ICON" };
}

function getColorIssue(input: CategoryInput): CategoryValidationIssue | null {
  if (
    typeof input.color === "string" &&
    HEX_COLOR_PATTERN.test(input.color)
  ) {
    return null;
  }

  return { field: "color", code: "INVALID_COLOR" };
}

function getTypeIssue(input: CategoryInput): CategoryValidationIssue | null {
  if (isCategoryType(input.type)) return null;

  return { field: "type", code: "INVALID_TYPE" };
}

/** Collects every field issue of a category input in display order. */
export function getCategoryIssues(
  input: CategoryInput,
): CategoryValidationIssue[] {
  return [
    getNameIssue(input),
    getIconIssue(input),
    getColorIssue(input),
    getTypeIssue(input),
  ].filter((issue): issue is CategoryValidationIssue => issue !== null);
}

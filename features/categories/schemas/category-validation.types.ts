export const CATEGORY_NAME_MAX_LENGTH = 40;

export type CategoryFormField = "ownerId" | "categoryId" | "name" | "icon" | "color" | "type";

export type CategoryValidationCode =
  | "OWNER_REQUIRED"
  | "CATEGORY_REQUIRED"
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "INVALID_ICON"
  | "INVALID_COLOR"
  | "INVALID_TYPE";

export interface CategoryValidationIssue {
  field: CategoryFormField;
  code: CategoryValidationCode;
  message: string;
}

export type CategoryValidationErrors = Partial<
  Record<CategoryFormField, string>
>;

/** Input accepted by validation; values are strings for runtime checks. */
export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  type: string;
}

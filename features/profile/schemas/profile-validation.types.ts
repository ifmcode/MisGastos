export const PROFILE_NAME_MAX_LENGTH = 50;

export type ProfileFormField = "uid" | "displayName" | "preferredCurrency";

export type ProfileValidationCode =
  | "UID_REQUIRED"
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "INVALID_CURRENCY";

export interface ProfileValidationIssue {
  field: ProfileFormField;
  code: ProfileValidationCode;
}

export type ProfileValidationErrors = Partial<
  Record<ProfileFormField, ProfileValidationCode>
>;

import {
  CurrencyCode,
  isCurrencyCode,
} from "@/shared/constants/currencies";
import { Result } from "@/shared/types/common.types";

import {
  ProfileFormValues,
  ProfileSaveInput,
  UpdateProfileDto,
  ValidatedProfileSaveInput,
} from "../types/profile.types";
import {
  PROFILE_NAME_MAX_LENGTH,
  ProfileValidationErrors,
  ProfileValidationIssue,
} from "./profile-validation.types";

export {
  PROFILE_NAME_MAX_LENGTH,
  type ProfileFormField,
  type ProfileValidationCode,
  type ProfileValidationErrors,
  type ProfileValidationIssue,
} from "./profile-validation.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readCurrency(value: unknown): CurrencyCode | null {
  return isCurrencyCode(value) ? value : null;
}

function getCurrencyIssues(
  currency: CurrencyCode | null,
): ProfileValidationIssue[] {
  return currency
    ? []
    : [{ field: "preferredCurrency", code: "INVALID_CURRENCY" }];
}

function getNameIssues(displayName: unknown): ProfileValidationIssue[] {
  const trimmed = readText(displayName).trim();

  if (trimmed.length === 0) {
    return [{ field: "displayName", code: "NAME_REQUIRED" }];
  }

  if (trimmed.length > PROFILE_NAME_MAX_LENGTH) {
    return [{ field: "displayName", code: "NAME_TOO_LONG" }];
  }

  return [];
}

export function validateProfileFormValues(
  input: ProfileFormValues,
): Result<UpdateProfileDto, ProfileValidationIssue[]> {
  const preferredCurrency = readCurrency(input.preferredCurrency);
  const issues = [
    ...getNameIssues(input.displayName),
    ...getCurrencyIssues(preferredCurrency),
  ];

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      displayName: input.displayName.trim(),
      preferredCurrency: preferredCurrency as CurrencyCode,
    },
  };
}

export function validateProfileSaveInput(
  input: ProfileSaveInput,
): Result<ValidatedProfileSaveInput, ProfileValidationIssue[]> {
  const uid = readText(input.uid).trim();
  const preferredCurrency = readCurrency(input.preferredCurrency);
  const issues: ProfileValidationIssue[] = [
    ...(uid.length === 0
      ? [{ field: "uid" as const, code: "UID_REQUIRED" as const }]
      : []),
    ...getNameIssues(input.displayName),
    ...getCurrencyIssues(preferredCurrency),
  ];

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  const email = readText(input.email).trim();

  return {
    ok: true,
    value: {
      uid,
      email: email.length > 0 ? email : null,
      displayName: readText(input.displayName).trim(),
      preferredCurrency: preferredCurrency as CurrencyCode,
    },
  };
}

export function toProfileFieldErrors(
  issues: readonly ProfileValidationIssue[],
): ProfileValidationErrors {
  return issues.reduce<ProfileValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.code;
    }
    return errors;
  }, {});
}

import { Result } from "@/shared/types/common.types";

import {
  FRIEND_EMAIL_MAX_LENGTH,
  FriendValidationIssue,
} from "./friend-validation.types";

/**
 * Same shape used by the login schema. Emails are normalized before this check;
 * the public profile stores the normalized value so exact-match search works.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeFriendEmail(value: unknown): string {
  return readText(value).trim().toLowerCase();
}

export function validateFriendEmail(
  value: unknown,
): Result<string, FriendValidationIssue[]> {
  const email = normalizeFriendEmail(value);

  if (email.length === 0) {
    return {
      ok: false,
      error: [{ field: "email", code: "EMAIL_REQUIRED" }],
    };
  }

  if (email.length > FRIEND_EMAIL_MAX_LENGTH) {
    return {
      ok: false,
      error: [{ field: "email", code: "EMAIL_TOO_LONG" }],
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      error: [{ field: "email", code: "EMAIL_INVALID" }],
    };
  }

  return { ok: true, value: email };
}

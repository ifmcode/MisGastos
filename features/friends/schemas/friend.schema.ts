import { Result } from "@/shared/types/common.types";

import {
  PublicProfileInput,
  SendFriendRequestInput,
  ValidatedFriendRequestPair,
} from "../types/friend.types";
import { getFriendPairMemberIds } from "../utils/friend-pair";
import { validateFriendEmail } from "./friend-email.schema";
import {
  FRIEND_DISPLAY_NAME_MAX_LENGTH,
  FriendValidationErrors,
  FriendValidationIssue,
} from "./friend-validation.types";

export {
  FRIEND_DISPLAY_NAME_MAX_LENGTH,
  FRIEND_EMAIL_MAX_LENGTH,
  type FriendValidationCode,
  type FriendValidationErrors,
  type FriendValidationField,
  type FriendValidationIssue,
} from "./friend-validation.types";
export { normalizeFriendEmail, validateFriendEmail } from "./friend-email.schema";

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readDisplayName(value: unknown): string | null {
  const trimmed = readText(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Validates the signed-in uid used by search, accept, reject and cancel. */
export function validateFriendViewerId(
  value: unknown,
): Result<string, FriendValidationIssue[]> {
  const uid = readText(value).trim();

  if (uid.length === 0) {
    return { ok: false, error: [{ field: "uid", code: "UID_REQUIRED" }] };
  }

  return { ok: true, value: uid };
}

export function validateSendFriendRequestInput(
  input: SendFriendRequestInput,
): Result<ValidatedFriendRequestPair, FriendValidationIssue[]> {
  const requesterId = readText(input.requesterId).trim();
  const recipientId = readText(input.recipientId).trim();
  const issues: FriendValidationIssue[] = [];

  if (requesterId.length === 0) {
    issues.push({ field: "requesterId", code: "REQUESTER_REQUIRED" });
  }

  if (recipientId.length === 0) {
    issues.push({ field: "recipientId", code: "RECIPIENT_REQUIRED" });
  }

  if (
    requesterId.length > 0 &&
    recipientId.length > 0 &&
    requesterId === recipientId
  ) {
    issues.push({ field: "recipientId", code: "SAME_USER" });
  }

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      requesterId,
      recipientId,
      participantIds: getFriendPairMemberIds(requesterId, recipientId),
    },
  };
}

export function validatePublicProfileInput(
  input: PublicProfileInput,
): Result<PublicProfileInput, FriendValidationIssue[]> {
  const uid = readText(input.uid).trim();
  const email = validateFriendEmail(input.email);
  const displayName = readDisplayName(input.displayName);
  const issues: FriendValidationIssue[] = [];

  if (uid.length === 0) {
    issues.push({ field: "uid", code: "UID_REQUIRED" });
  }

  if (!email.ok) {
    issues.push(...email.error);
  }

  if (
    displayName !== null &&
    displayName.length > FRIEND_DISPLAY_NAME_MAX_LENGTH
  ) {
    issues.push({ field: "displayName", code: "DISPLAY_NAME_TOO_LONG" });
  }

  if (issues.length > 0 || !email.ok) {
    return { ok: false, error: issues };
  }

  return { ok: true, value: { uid, displayName, email: email.value } };
}

export function toFriendFieldErrors(
  issues: readonly FriendValidationIssue[],
): FriendValidationErrors {
  return issues.reduce<FriendValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.code;
    }
    return errors;
  }, {});
}

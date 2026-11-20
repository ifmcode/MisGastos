import type { Result } from "@/shared/types/common.types";
import { isCurrencyCode, type CurrencyCode } from "@/shared/constants/currencies";

import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  type GroupInput,
  type GroupUpdateInput,
  type ValidatedGroup,
  type ValidatedGroupMetadata,
} from "../types/group.types";
import {
  GROUP_MAX_INVITEES,
  type GroupValidationErrors,
  type GroupValidationIssue,
} from "./group-validation.types";

export {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_MAX_INVITEES,
  GROUP_MAX_MEMBERS,
  GROUP_NAME_MAX_LENGTH,
  type GroupValidationCode,
  type GroupValidationErrors,
  type GroupValidationField,
  type GroupValidationIssue,
} from "./group-validation.types";

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readName(value: unknown, issues: GroupValidationIssue[]): string {
  const name = readText(value);

  if (name.length === 0) issues.push({ field: "name", code: "NAME_REQUIRED" });
  else if (name.length > GROUP_NAME_MAX_LENGTH) {
    issues.push({ field: "name", code: "NAME_TOO_LONG" });
  }

  return name;
}

function readDescription(
  value: unknown,
  issues: GroupValidationIssue[],
): string | null {
  if (value === null || value === undefined) return null;

  const description = readText(value);

  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    issues.push({ field: "description", code: "DESCRIPTION_TOO_LONG" });
  }

  return description.length > 0 ? description : null;
}

function readCurrency(
  value: unknown,
  issues: GroupValidationIssue[],
): CurrencyCode {
  if (isCurrencyCode(value)) return value;

  issues.push({ field: "defaultCurrency", code: "CURRENCY_INVALID" });
  return "EUR";
}

/** Accepted friends only (checked by the service), never the owner, at most 19. */
export function validateGroupInviteeIds(
  inviteeIds: unknown,
  ownerId: string,
): Result<string[], GroupValidationIssue[]> {
  if (!Array.isArray(inviteeIds)) {
    return {
      ok: false,
      error: [{ field: "inviteeIds", code: "INVITEES_REQUIRED" }],
    };
  }

  const owner = readText(ownerId);
  const raw: unknown[] = inviteeIds;
  const ids = raw.map((value) => readText(value));
  const issues: GroupValidationIssue[] = [];

  if (ids.length === 0) {
    issues.push({ field: "inviteeIds", code: "INVITEES_REQUIRED" });
  } else if (ids.length > GROUP_MAX_INVITEES) {
    issues.push({ field: "inviteeIds", code: "INVITEES_TOO_MANY" });
  }

  if (ids.some((id) => id.length === 0 || id === owner)) {
    issues.push({ field: "inviteeIds", code: "INVITEE_INVALID" });
  }

  if (new Set(ids).size !== ids.length) {
    issues.push({ field: "inviteeIds", code: "INVITEES_DUPLICATE" });
  }

  if (issues.length > 0) return { ok: false, error: issues };

  return { ok: true, value: ids };
}

function readMetadata(
  input: GroupUpdateInput,
  issues: GroupValidationIssue[],
): ValidatedGroupMetadata {
  return {
    name: readName(input.name, issues),
    description: readDescription(input.description, issues),
    defaultCurrency: readCurrency(input.defaultCurrency, issues),
  };
}

/** Validates the creation form; friendship is checked by the service. */
export function validateGroupInput(
  input: GroupInput,
  ownerId: string,
): Result<ValidatedGroup, GroupValidationIssue[]> {
  const issues: GroupValidationIssue[] = [];
  const metadata = readMetadata(input, issues);
  const invitees = validateGroupInviteeIds(input.inviteeIds, ownerId);

  if (!invitees.ok) issues.push(...invitees.error);
  if (issues.length > 0 || !invitees.ok) return { ok: false, error: issues };

  return { ok: true, value: { ...metadata, inviteeIds: invitees.value } };
}

/** Validates the owner edit of name, description and default currency. */
export function validateGroupUpdateInput(
  input: GroupUpdateInput,
): Result<ValidatedGroupMetadata, GroupValidationIssue[]> {
  const issues: GroupValidationIssue[] = [];
  const metadata = readMetadata(input, issues);

  if (issues.length > 0) return { ok: false, error: issues };

  return { ok: true, value: metadata };
}

export function toGroupFieldErrors(
  issues: readonly GroupValidationIssue[],
): GroupValidationErrors {
  return issues.reduce<GroupValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) errors[issue.field] = issue.code;
    return errors;
  }, {});
}

import type { GroupExpenseInput } from "../types/group-expense.types";
import { GROUP_EXPENSE_MAX_PARTICIPANTS } from "../types/group-expense.types";
import { readText } from "./group-expense-text";
import type { GroupExpenseValidationIssue } from "./group-expense-validation.types";

/** Membership comes from the group document; normalize it once per validation. */
export function readMemberIds(memberIds: readonly unknown[]): string[] {
  const members: string[] = [];

  for (const value of memberIds) {
    const uid = readText(value);
    if (uid.length > 0 && !members.includes(uid)) members.push(uid);
  }

  return members;
}

function readParticipantId(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";

  return readText((value as { userId?: unknown }).userId);
}

/**
 * At least one selected participant, at most 20, unique and all active group
 * members. The payer is deliberately not required here: paying for others and
 * being excluded from the split is a valid group expense.
 */
export function readParticipantIds(
  input: GroupExpenseInput,
  members: readonly string[],
  issues: GroupExpenseValidationIssue[],
): string[] | null {
  const rows = Array.isArray(input.participants) ? input.participants : [];

  if (rows.length === 0) {
    issues.push({ field: "participants", code: "PARTICIPANTS_REQUIRED" });
    return null;
  }

  if (rows.length > GROUP_EXPENSE_MAX_PARTICIPANTS) {
    issues.push({ field: "participants", code: "PARTICIPANTS_TOO_MANY" });
    return null;
  }

  const ids: string[] = [];
  let invalid = false;
  let duplicate = false;
  let foreign = false;

  for (const row of rows) {
    const userId = readParticipantId(row);

    if (userId.length === 0) {
      invalid = true;
      continue;
    }

    if (ids.includes(userId)) {
      duplicate = true;
      continue;
    }

    if (!members.includes(userId)) foreign = true;
    ids.push(userId);
  }

  if (invalid) issues.push({ field: "participants", code: "PARTICIPANT_INVALID" });
  if (duplicate) {
    issues.push({ field: "participants", code: "PARTICIPANTS_DUPLICATE" });
  }
  if (foreign) {
    issues.push({ field: "participants", code: "PARTICIPANT_NOT_MEMBER" });
  }

  return invalid || duplicate || foreign ? null : ids;
}

/** The payer may be excluded from `participants` but must be an active member. */
export function readPayerId(
  value: unknown,
  members: readonly string[],
  issues: GroupExpenseValidationIssue[],
): string | null {
  const payerId = readText(value);

  if (payerId.length === 0) {
    issues.push({ field: "payerId", code: "PAYER_REQUIRED" });
    return null;
  }

  if (!members.includes(payerId)) {
    issues.push({ field: "payerId", code: "PAYER_NOT_MEMBER" });
    return null;
  }

  return payerId;
}

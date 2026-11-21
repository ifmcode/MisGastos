import type { Result } from "@/shared/types/common.types";

import { splitExpenseAmount } from "@/features/shared-expenses/utils/expense-split";
import { parseSplitParticipants } from "@/features/shared-expenses/utils/expense-split-values";

import type {
  GroupExpenseInput,
  ValidatedGroupExpense,
} from "../types/group-expense.types";
import { parseGroupExpenseFields } from "./group-expense-fields";
import { readMemberIds } from "./group-expense-participants";
import type {
  GroupExpenseFieldErrors,
  GroupExpenseValidationIssue,
} from "./group-expense-validation.types";

export {
  GROUP_EXPENSE_AMOUNT_MAX_CENTS,
  GROUP_EXPENSE_DESCRIPTION_MAX_LENGTH,
  GROUP_EXPENSE_MAX_PARTICIPANTS,
  type ExpenseSplitMode,
} from "../types/group-expense.types";

export {
  type GroupExpenseFieldErrors,
  type GroupExpenseFormField,
  type GroupExpenseValidationCode,
  type GroupExpenseValidationIssue,
} from "./group-expense-validation.types";

/**
 * Validates the group-expense form against the group members and returns the
 * normalized payload the service persists: integer cents and exact shares.
 *
 * Group membership, uniqueness and participation are checked here; the group
 * read and the edit permissions stay in the service. The split runs with
 * `minParticipants: 1` because a group may invoice a SINGLE participant when the
 * payer pays for others and is excluded from the split.
 */
export function validateGroupExpenseInput(
  input: GroupExpenseInput,
  viewerUid: string,
  memberIds: readonly string[],
): Result<ValidatedGroupExpense, GroupExpenseValidationIssue[]> {
  const members = readMemberIds(memberIds);
  const viewer = typeof viewerUid === "string" ? viewerUid.trim() : "";

  // Defense in depth: the service rejects a non-member with the
  // NOT_GROUP_MEMBER operation code before it validates the payload.
  if (viewer.length === 0 || !members.includes(viewer)) {
    return {
      ok: false,
      error: [{ field: "groupId", code: "NOT_GROUP_MEMBER" }],
    };
  }

  const issues: GroupExpenseValidationIssue[] = [];
  const parsed = parseGroupExpenseFields(input, members, issues);

  if (parsed === null || issues.length > 0) {
    return { ok: false, error: issues };
  }

  const values = parseSplitParticipants(parsed.splitMode, input.participants);

  if (!values.ok) {
    return { ok: false, error: [{ field: "participants", code: values.error }] };
  }

  const shares = splitExpenseAmount(
    parsed.amountCents,
    parsed.splitMode,
    values.value,
    { minParticipants: 1 },
  );

  if (!shares.ok) {
    return { ok: false, error: [{ field: "participants", code: shares.error }] };
  }

  return {
    ok: true,
    value: {
      groupId: parsed.groupId,
      payerId: parsed.payerId,
      amountCents: parsed.amountCents,
      currency: parsed.currency,
      splitMode: parsed.splitMode,
      participants: shares.value,
      description: parsed.description,
      date: parsed.date,
    },
  };
}

export function toGroupExpenseFieldErrors(
  issues: readonly GroupExpenseValidationIssue[],
): GroupExpenseFieldErrors {
  return issues.reduce<GroupExpenseFieldErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.code;
    }

    return errors;
  }, {});
}

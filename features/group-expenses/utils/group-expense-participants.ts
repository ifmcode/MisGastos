import type { GroupExpenseFormValues } from "./group-expense-form";

/** Trimmed, non-empty and unique ids, keeping the first occurrence order. */
export function readGroupExpenseIds(values: readonly string[]): string[] {
  const ids: string[] = [];

  for (const value of values) {
    const id = typeof value === "string" ? value.trim() : "";
    if (id.length > 0 && !ids.includes(id)) ids.push(id);
  }

  return ids;
}

/**
 * The payer must be a member but does not have to participate. Keep the stored
 * payer when it is still a member, otherwise fall back to the viewer and then to
 * the first member, so a create always starts with a valid payer.
 */
export function resolveGroupExpensePayer(
  payerId: string,
  memberIds: readonly string[],
  fallbackId: string,
): string {
  const members = readGroupExpenseIds(memberIds);
  const payer = typeof payerId === "string" ? payerId.trim() : "";
  if (members.includes(payer)) return payer;

  const fallback = typeof fallbackId === "string" ? fallbackId.trim() : "";
  if (members.includes(fallback)) return fallback;

  return members[0] ?? "";
}

/** Selected participants, unique and ordered as the group member list. */
export function getGroupExpenseParticipantIds(
  values: GroupExpenseFormValues,
): string[] {
  const selected = readGroupExpenseIds(values.participantIds);

  return values.memberIds.filter((memberId) => selected.includes(memberId));
}

/** A member outside the group is ignored: only active members participate. */
export function toggleGroupExpenseParticipant(
  values: GroupExpenseFormValues,
  userId: string,
): GroupExpenseFormValues {
  const id = typeof userId === "string" ? userId.trim() : "";
  if (id.length === 0 || !values.memberIds.includes(id)) return values;

  const selected = values.participantIds.includes(id)
    ? values.participantIds.filter((current) => current !== id)
    : [...values.participantIds, id];

  return {
    ...values,
    participantIds: values.memberIds.filter((memberId) =>
      selected.includes(memberId),
    ),
  };
}

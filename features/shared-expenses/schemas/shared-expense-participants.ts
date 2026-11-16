import type { SharedExpenseInput } from "../types/shared-expense.types";
import type { SharedExpenseValidationIssue } from "./shared-expense-validation.types";

const PARTICIPANT_COUNT = 2;

function readId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The 1:1 slice needs exactly the viewer and the other accepted friend. Group
 * expressions will replace this guard when TICKET-008 lands.
 */
export function readParticipantIds(
  input: SharedExpenseInput,
  viewerUid: string,
  issues: SharedExpenseValidationIssue[],
): string[] | null {
  const ids = input.participants.map((participant) => readId(participant.userId));
  const viewer = readId(viewerUid);
  const friend = readId(input.friendUid);

  const isValid =
    ids.length === PARTICIPANT_COUNT &&
    ids.every((id) => id.length > 0) &&
    ids[0] !== ids[1] &&
    viewer.length > 0 &&
    ids.includes(viewer) &&
    ids.includes(friend) &&
    friend !== viewer;

  if (!isValid) {
    issues.push({ field: "participants", code: "PARTICIPANTS_INVALID" });
    return null;
  }

  return ids.sort();
}

export function readPayerId(
  value: unknown,
  participantIds: string[] | null,
  issues: SharedExpenseValidationIssue[],
): string | null {
  const payerId = readId(value);

  if (payerId.length === 0) {
    issues.push({ field: "payerId", code: "PAYER_REQUIRED" });
    return null;
  }

  if (participantIds !== null && !participantIds.includes(payerId)) {
    issues.push({ field: "payerId", code: "PAYER_NOT_PARTICIPANT" });
    return null;
  }

  return payerId;
}

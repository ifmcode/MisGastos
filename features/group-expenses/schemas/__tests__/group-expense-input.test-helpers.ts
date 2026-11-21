import type {
  GroupExpenseInput,
  SharedExpenseParticipantInput,
} from "../../types/group-expense.types";
import { validateGroupExpenseInput } from "../group-expense.schema";

export const VIEWER = "user-a";
export const GROUP_ID = "user-a__group-1";
export const MEMBERS = ["user-a", "user-b", "user-c"];

/** Valid group form payload paid by the viewer; override the field under test. */
export function buildInput(
  overrides: Partial<GroupExpenseInput> = {},
): GroupExpenseInput {
  return {
    groupId: GROUP_ID,
    description: " Dinner ",
    amount: "10.00",
    currency: "EUR",
    date: "2026-11-10",
    payerId: "user-a",
    splitMode: "equal",
    participants: participantRows("user-a", "user-b"),
    ...overrides,
  };
}

export function participantRows(
  ...userIds: string[]
): SharedExpenseParticipantInput[] {
  return userIds.map((userId) => ({ userId, value: "" }));
}

/** Issues of the overridden payload, or `"ok"` when it validates. */
export function issuesOf(
  overrides: Partial<GroupExpenseInput>,
  viewerUid = VIEWER,
  memberIds = MEMBERS,
): unknown {
  const result = validateGroupExpenseInput(
    buildInput(overrides),
    viewerUid,
    memberIds,
  );

  return result.ok ? "ok" : result.error;
}

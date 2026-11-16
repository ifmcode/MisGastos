import type {
  SharedExpenseInput,
  SharedExpenseParticipantInput,
} from "../../types/shared-expense.types";
import { validateSharedExpenseInput } from "../shared-expense.schema";

export const VIEWER = "user-a";

/** Valid 1:1 form payload; override only the field under test. */
export function buildInput(
  overrides: Partial<SharedExpenseInput> = {},
): SharedExpenseInput {
  return {
    friendUid: "user-b",
    description: " Dinner ",
    amount: "10.00",
    currency: "EUR",
    date: "2026-11-10",
    payerId: "user-a",
    splitMode: "equal",
    participants: [
      { userId: "user-a", value: "" },
      { userId: "user-b", value: "" },
    ],
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
  overrides: Partial<SharedExpenseInput>,
  viewerUid = VIEWER,
): unknown {
  const result = validateSharedExpenseInput(buildInput(overrides), viewerUid);

  return result.ok ? "ok" : result.error;
}

import type {
  CreateGroupExpenseDto,
  UpdateGroupExpenseDto,
} from "../../types/group-expense.types";

export const GROUP_ID = "user-a__group-1";
export const CREATED_AT = "2026-11-10T20:00:00.000Z";

const PARTICIPANTS = [
  { userId: "user-a", shareCents: 500 },
  { userId: "user-b", shareCents: 500 },
];

/** Valid Firestore payload of a group expense document. */
export function buildDocument(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    groupId: GROUP_ID,
    payerId: "user-a",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: PARTICIPANTS,
    description: "Dinner",
    date: "2026-11-10",
    createdBy: "user-a",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

export function buildCreateDto(
  overrides: Partial<CreateGroupExpenseDto> = {},
): CreateGroupExpenseDto {
  return {
    groupId: GROUP_ID,
    payerId: "user-a",
    amountCents: 1000,
    currency: "EUR",
    splitMode: "equal",
    participants: PARTICIPANTS,
    description: "Dinner",
    date: "2026-11-10",
    createdBy: "user-a",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  };
}

export function buildUpdateDto(
  overrides: Partial<UpdateGroupExpenseDto> = {},
): UpdateGroupExpenseDto {
  return {
    payerId: "user-b",
    amountCents: 2000,
    currency: "EUR",
    splitMode: "equal",
    participants: [
      { userId: "user-a", shareCents: 1000 },
      { userId: "user-b", shareCents: 1000 },
    ],
    description: "Lunch",
    date: "2026-11-11",
    updatedAt: "2026-11-11T10:00:00.000Z",
    ...overrides,
  };
}

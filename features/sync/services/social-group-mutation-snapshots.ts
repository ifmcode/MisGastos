import { isCurrencyCode } from "@/shared/constants/currencies";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import type {
  CreateGroupExpenseDto,
  ExpenseSplitMode,
  SharedExpenseParticipant,
  UpdateGroupExpenseDto,
} from "@/features/group-expenses/types/group-expense.types";
import type {
  CreateGroupSettlementDto,
  UpdateGroupSettlementDto,
} from "@/features/group-expenses/types/group-settlement.types";

function invalid(): never {
  throw new SyncMutationError("INVALID", "SYNC_SNAPSHOT_INVALID");
}

function readString(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot[key];
  if (typeof value !== "string" || value.trim().length === 0) invalid();
  return value;
}

function readOptional(
  snapshot: Record<string, unknown>,
  key: string,
): string | null {
  const value = snapshot[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") invalid();
  return value.length > 0 ? value : null;
}

function readInt(snapshot: Record<string, unknown>, key: string): number {
  const value = snapshot[key];
  if (typeof value !== "number" || !Number.isInteger(value)) invalid();
  return value;
}

function readArray(snapshot: Record<string, unknown>, key: string): unknown[] {
  const value = snapshot[key];
  if (!Array.isArray(value)) invalid();
  return value;
}

function readStrings(snapshot: Record<string, unknown>, key: string): string[] {
  return readArray(snapshot, key).map((item) => {
    if (typeof item !== "string") invalid();
    return item;
  });
}

function readParticipants(
  snapshot: Record<string, unknown>,
): SharedExpenseParticipant[] {
  return readArray(snapshot, "participants") as SharedExpenseParticipant[];
}

function readCurrency(snapshot: Record<string, unknown>) {
  const value = snapshot.currency;
  if (!isCurrencyCode(value)) invalid();
  return value;
}

function readSplitMode(snapshot: Record<string, unknown>): ExpenseSplitMode {
  const value = snapshot.splitMode;
  if (
    value !== "equal" &&
    value !== "percentage" &&
    value !== "fixed" &&
    value !== "shares"
  ) {
    invalid();
  }
  return value;
}

export function readGroupExpenseCreateDto(
  snapshot: Record<string, unknown>,
): CreateGroupExpenseDto {
  return {
    groupId: readString(snapshot, "groupId"),
    payerId: readString(snapshot, "payerId"),
    amountCents: readInt(snapshot, "amountCents"),
    currency: readCurrency(snapshot),
    splitMode: readSplitMode(snapshot),
    participants: readParticipants(snapshot),
    description: readString(snapshot, "description"),
    date: readString(snapshot, "date"),
    walletId: readOptional(snapshot, "walletId"),
    categoryId: readOptional(snapshot, "categoryId"),
    linkedTransactionId: readOptional(snapshot, "linkedTransactionId"),
    createdBy: readString(snapshot, "createdBy"),
    createdAt: readString(snapshot, "createdAt"),
    updatedAt: readString(snapshot, "updatedAt"),
    deletedAt: null,
  };
}

export function readGroupExpenseUpdateDto(
  snapshot: Record<string, unknown>,
): UpdateGroupExpenseDto {
  return {
    payerId: readString(snapshot, "payerId"),
    amountCents: readInt(snapshot, "amountCents"),
    currency: readCurrency(snapshot),
    splitMode: readSplitMode(snapshot),
    participants: readParticipants(snapshot),
    description: readString(snapshot, "description"),
    date: readString(snapshot, "date"),
    walletId: readOptional(snapshot, "walletId"),
    categoryId: readOptional(snapshot, "categoryId"),
    // Owned by the link operation; never clear it from a stale snapshot.
    updatedAt: readString(snapshot, "updatedAt"),
  };
}

export function readGroupSettlementCreateDto(
  snapshot: Record<string, unknown>,
): CreateGroupSettlementDto {
  return {
    groupId: readString(snapshot, "groupId"),
    participantIds: readStrings(snapshot, "participantIds"),
    pairId: readString(snapshot, "pairId"),
    fromUserId: readString(snapshot, "fromUserId"),
    toUserId: readString(snapshot, "toUserId"),
    amountCents: readInt(snapshot, "amountCents"),
    currency: readCurrency(snapshot),
    date: readString(snapshot, "date"),
    note: readOptional(snapshot, "note") ?? "",
    createdBy: readString(snapshot, "createdBy"),
    createdAt: readString(snapshot, "createdAt"),
    updatedAt: readString(snapshot, "updatedAt"),
    deletedAt: null,
    receiverWalletId: readOptional(snapshot, "receiverWalletId"),
    receiverCategoryId: readOptional(snapshot, "receiverCategoryId"),
    receiverTransactionId: readOptional(snapshot, "receiverTransactionId"),
  };
}

export function readGroupSettlementUpdateDto(
  snapshot: Record<string, unknown>,
): UpdateGroupSettlementDto {
  return {
    amountCents: readInt(snapshot, "amountCents"),
    date: readString(snapshot, "date"),
    note: readOptional(snapshot, "note") ?? "",
    updatedAt: readString(snapshot, "updatedAt"),
    receiverWalletId: readOptional(snapshot, "receiverWalletId"),
    receiverCategoryId: readOptional(snapshot, "receiverCategoryId"),
    receiverTransactionId: readOptional(snapshot, "receiverTransactionId"),
  };
}

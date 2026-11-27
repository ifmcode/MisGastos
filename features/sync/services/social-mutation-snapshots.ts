import { isCurrencyCode } from "@/shared/constants/currencies";
import { SyncMutationError } from "@/shared/services/sync/sync.errors";
import type { NotificationWrite } from "@/features/notifications/types/notification.types";

import type {
  CreateSharedExpenseDto,
  ExpenseSplitMode,
  SharedExpenseParticipant,
  UpdateSharedExpenseDto,
} from "@/features/shared-expenses/types/shared-expense.types";
import type {
  CreateSettlementDto,
  UpdateSettlementDto,
} from "@/features/settlements/types/settlement.types";

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

export function readSharedExpenseCreateDto(
  snapshot: Record<string, unknown>,
): CreateSharedExpenseDto {
  return {
    participantIds: readStrings(snapshot, "participantIds"),
    pairId: readString(snapshot, "pairId"),
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

export function readSharedExpenseUpdateDto(
  snapshot: Record<string, unknown>,
): UpdateSharedExpenseDto {
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
    // `linkedTransactionId` is owned by the link operation, which reads the
    // stored movement; a stale local snapshot must never clear it.
    updatedAt: readString(snapshot, "updatedAt"),
  };
}

export function readSettlementCreateDto(
  snapshot: Record<string, unknown>,
): CreateSettlementDto {
  return {
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

export function readSettlementUpdateDto(
  snapshot: Record<string, unknown>,
): UpdateSettlementDto {
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

export function readNotification(
  snapshot: Record<string, unknown>,
): NotificationWrite {
  const value = snapshot.notification;
  if (typeof value !== "object" || value === null) invalid();
  return value as NotificationWrite;
}

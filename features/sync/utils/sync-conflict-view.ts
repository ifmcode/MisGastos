import { isCurrencyCode } from "@/shared/constants/currencies";
import type {
  LocalConflict,
  LocalConflictKind,
  LocalConflictResolution,
} from "@/shared/lib/local-db/local-db.types";
import { getConflictResolutionOptions } from "@/shared/services/sync/sync.conflict-policy";
import { formatMoney } from "@/features/wallets/utils/money";

/** One highlighted value of a snapshot; `key` is a translation key suffix. */
export type SyncConflictField = {
  key: "amount" | "concept" | "wallet" | "date" | "status";
  value: string;
};

export type SyncConflictView = {
  id: string;
  kind: LocalConflictKind;
  titleKey: string;
  descriptionKey: string;
  options: readonly LocalConflictResolution[];
  mine: SyncConflictField[];
  remote: SyncConflictField[];
};

const TITLE_KEYS: Record<LocalConflictKind, string> = {
  REMOTE_CHANGED: "conflict.kinds.REMOTE_CHANGED.title",
  DELETED_REMOTELY: "conflict.kinds.DELETED_REMOTELY.title",
  WALLET_UNAVAILABLE: "conflict.kinds.WALLET_UNAVAILABLE.title",
  INSUFFICIENT_FUNDS: "conflict.kinds.INSUFFICIENT_FUNDS.title",
  INVALID: "conflict.kinds.INVALID.title",
};

const DESCRIPTION_KEYS: Record<LocalConflictKind, string> = {
  REMOTE_CHANGED: "conflict.kinds.REMOTE_CHANGED.description",
  DELETED_REMOTELY: "conflict.kinds.DELETED_REMOTELY.description",
  WALLET_UNAVAILABLE: "conflict.kinds.WALLET_UNAVAILABLE.description",
  INSUFFICIENT_FUNDS: "conflict.kinds.INSUFFICIENT_FUNDS.description",
  INVALID: "conflict.kinds.INVALID.description",
};

export const DELETED_STATUS_VALUE = "deleted";

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  snapshot: Record<string, unknown>,
  key: string,
): string | null {
  const value = snapshot[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function buildFields(
  snapshot: Record<string, unknown>,
  walletNames: ReadonlyMap<string, string> | undefined,
): SyncConflictField[] {
  const fields: SyncConflictField[] = [];
  const amountCents = snapshot.amountCents;
  const amount =
    typeof amountCents === "number" && Number.isFinite(amountCents)
      ? amountCents / 100
      : snapshot.amount;
  const currency = snapshot.currency;

  if (typeof amount === "number" && isCurrencyCode(currency)) {
    fields.push({ key: "amount", value: formatMoney(amount, currency) });
  }

  const concept =
    readString(snapshot, "concept") ??
    readString(snapshot, "description") ??
    readString(snapshot, "note");
  if (concept) fields.push({ key: "concept", value: concept });

  const fromWalletId = readString(snapshot, "fromWalletId");
  const toWalletId = readString(snapshot, "toWalletId");
  const walletId =
    readString(snapshot, "walletId") ??
    readString(snapshot, "receiverWalletId");
  const label = (id: string) => walletNames?.get(id) ?? id;

  if (fromWalletId && toWalletId) {
    fields.push({
      key: "wallet",
      value: `${label(fromWalletId)} → ${label(toWalletId)}`,
    });
  } else if (walletId) {
    fields.push({ key: "wallet", value: label(walletId) });
  }

  const date = readString(snapshot, "date");
  if (date) fields.push({ key: "date", value: date });

  if (readString(snapshot, "deletedAt")) {
    fields.push({ key: "status", value: DELETED_STATUS_VALUE });
  }

  return fields;
}

/**
 * View model of one conflict: the kind copy, the available decisions and the
 * highlighted values of both snapshots. `walletNames` lets the screen show a
 * readable wallet instead of its id; without it the id is the fallback.
 */
export function toSyncConflictView(
  conflict: LocalConflict,
  walletNames?: ReadonlyMap<string, string>,
): SyncConflictView {
  return {
    id: conflict.id,
    kind: conflict.kind,
    titleKey: TITLE_KEYS[conflict.kind],
    descriptionKey: DESCRIPTION_KEYS[conflict.kind],
    options: getConflictResolutionOptions(conflict.kind),
    mine: buildFields(readRecord(conflict.localSnapshot), walletNames),
    remote: buildFields(readRecord(conflict.remoteSnapshot), walletNames),
  };
}

import type { LocalConflictKind } from "@/shared/lib/local-db/local-db.types";

/**
 * Raised by a server operation when the idempotency guard stops a mutation.
 * `kind` is the stable conflict the sync engine stores; `code` is technical.
 */
export class SyncMutationError extends Error {
  readonly kind: LocalConflictKind;
  readonly code: string;

  constructor(kind: LocalConflictKind, code: string = `SYNC_${kind}`) {
    super(code);
    this.name = "SyncMutationError";
    this.kind = kind;
    this.code = code;
  }
}

export type SyncErrorClassification =
  | { status: "retry"; errorCode: string }
  | { status: "failed"; errorCode: string }
  | { status: "conflict"; kind: LocalConflictKind; errorCode: string };

/** Firestore failures worth retrying; the queue pauses instead of skipping. */
const TRANSIENT_CODES: ReadonlySet<string> = new Set([
  "unavailable",
  "deadline-exceeded",
  "network-request-failed",
  "resource-exhausted",
  "aborted",
]);

/**
 * Domain codes the operations already return, mapped to the conflict the user
 * has to resolve (ADR §7). Anything not listed is a permanent failure.
 */
const DOMAIN_CONFLICTS: Record<string, LocalConflictKind> = {
  TRANSACTION_NOT_FOUND: "DELETED_REMOTELY",
  TRANSFER_NOT_FOUND: "DELETED_REMOTELY",
  SETTLEMENT_NOT_FOUND: "DELETED_REMOTELY",
  WALLET_NOT_FOUND: "WALLET_UNAVAILABLE",
  WALLET_NOT_OWNED: "WALLET_UNAVAILABLE",
  WALLET_ARCHIVED: "WALLET_UNAVAILABLE",
  CURRENCY_MISMATCH: "WALLET_UNAVAILABLE",
  FROM_WALLET_NOT_FOUND: "WALLET_UNAVAILABLE",
  TO_WALLET_NOT_FOUND: "WALLET_UNAVAILABLE",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_FUNDS",
  TRANSACTION_INVALID: "INVALID",
  TRANSFER_INVALID: "INVALID",
  SAME_WALLET: "INVALID",
  // Social movements: a changed group, membership, debt or link shape makes the
  // queued payload invalid against the current server state.
  ALREADY_DELETED: "DELETED_REMOTELY",
  GROUP_NOT_FOUND: "INVALID",
  NOT_GROUP_MEMBER: "INVALID",
  PAYER_NOT_MEMBER: "INVALID",
  NOT_EXPENSE_EDITOR: "INVALID",
  EXPENSE_HAS_FORMER_MEMBERS: "INVALID",
  NOT_PARTICIPANT: "INVALID",
  NOT_FRIEND: "INVALID",
  NO_DEBT: "INVALID",
  AMOUNT_EXCEEDS_DEBT: "INVALID",
  AMOUNT_LOCKED: "INVALID",
  DIRECTION_MISMATCH: "INVALID",
  LINKED_MOVEMENT_NOT_REVERTIBLE: "INVALID",
  LINKED_MOVEMENT_FOREIGN: "INVALID",
  SETTLEMENT_HAS_RECEIVER_MOVEMENT: "INVALID",
  GROUP_CHANGED: "INVALID",
  LINK_WITHOUT_REGISTRATION: "INVALID",
  CATEGORY_REQUIRED: "INVALID",
  WALLET_REQUIRED: "INVALID",
};

export function readSyncErrorCode(error: unknown): string {
  if (error instanceof SyncMutationError) return error.code;

  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.length > 0
    ? code
    : "SYNC_UNKNOWN_ERROR";
}

/**
 * Classifies one executor failure: transient (retry with backoff), conflict
 * (stop and ask the user) or permanent (manual retry only).
 */
export function classifySyncError(error: unknown): SyncErrorClassification {
  if (error instanceof SyncMutationError) {
    return {
      status: "conflict",
      kind: error.kind,
      errorCode: error.code,
    };
  }

  const errorCode = readSyncErrorCode(error);

  if (TRANSIENT_CODES.has(errorCode)) {
    return { status: "retry", errorCode };
  }

  const kind = DOMAIN_CONFLICTS[errorCode];
  if (kind) return { status: "conflict", kind, errorCode };

  if (errorCode === "not-found") {
    return { status: "conflict", kind: "DELETED_REMOTELY", errorCode };
  }

  if (errorCode === "invalid-argument" || errorCode === "failed-precondition") {
    return { status: "conflict", kind: "INVALID", errorCode };
  }

  return { status: "failed", errorCode };
}

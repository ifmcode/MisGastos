/**
 * Stable codes for local database failures. Services and the UI translate
 * them; no user-facing sentence ever leaves this layer.
 */
export const LOCAL_DB_ERROR_CODES = {
  /** A migration statement or the version write failed (cause is wrapped). */
  MIGRATION_FAILED: "LOCAL_DB_MIGRATION_FAILED",
  /** The stored schema is newer than this binary knows how to read. */
  SCHEMA_NEWER: "LOCAL_DB_SCHEMA_NEWER",
  /** Opening the native database failed; `getLocalDatabase` resolves null. */
  OPEN_FAILED: "LOCAL_DB_OPEN_FAILED",
  /** A transaction was opened while another one was still active. */
  NESTED_TRANSACTION: "LOCAL_DB_NESTED_TRANSACTION",
  /** A unique key (other than the primary key) already exists. */
  UNIQUE_VIOLATION: "LOCAL_DB_UNIQUE_VIOLATION",
  OUTBOX_MUTATION_NOT_FOUND: "OUTBOX_MUTATION_NOT_FOUND",
  OUTBOX_INVALID_TRANSITION: "OUTBOX_INVALID_TRANSITION",
  /** The mutation is being pushed; its payload must not be replaced. */
  OUTBOX_MUTATION_IN_FLIGHT: "OUTBOX_MUTATION_IN_FLIGHT",
  /** The mutation has an unresolved conflict and keeps its evidence. */
  OUTBOX_CONFLICT_UNRESOLVED: "OUTBOX_CONFLICT_UNRESOLVED",
  /** The conflict the user is resolving no longer exists (already closed). */
  CONFLICT_NOT_FOUND: "SYNC_CONFLICT_NOT_FOUND",
} as const;

export type LocalDbErrorCode =
  (typeof LOCAL_DB_ERROR_CODES)[keyof typeof LOCAL_DB_ERROR_CODES];

export class LocalDbError extends Error {
  readonly code: LocalDbErrorCode;

  constructor(code: LocalDbErrorCode, options: { cause?: unknown } = {}) {
    super(code);
    this.name = "LocalDbError";
    this.code = code;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

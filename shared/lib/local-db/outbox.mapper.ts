import type {
  LocalColumnValue,
  LocalRow,
  OutboxDependency,
  OutboxEntityType,
  OutboxMutation,
  OutboxOperation,
  OutboxStatus,
} from "./local-db.types";

const ENTITY_TYPES = [
  "wallet",
  "category",
  "transaction",
  "transfer",
  "shared-expense",
  "settlement",
  "group-expense",
  "group-settlement",
] as const;
const OPERATIONS = ["create", "update", "delete"] as const;
const STATUSES = ["pending", "syncing", "failed", "conflict"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && (values as readonly string[]).includes(value)
  );
}

function readString(row: LocalRow, column: string): string {
  const value = row[column];
  return typeof value === "string" ? value : "";
}

function readNumber(row: LocalRow, column: string): number {
  const value = row[column];
  return typeof value === "number" ? value : 0;
}

function readNullableString(row: LocalRow, column: string): string | null {
  const value = row[column];
  return typeof value === "string" ? value : null;
}

/** Malformed JSON never throws: it degrades to an empty snapshot. */
function decodeSnapshot(value: LocalColumnValue): Record<string, unknown> {
  if (typeof value !== "string" || value.length === 0) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isDependency(value: unknown): value is OutboxDependency {
  return (
    isRecord(value) &&
    isOneOf(ENTITY_TYPES, value.entityType) &&
    typeof value.entityId === "string"
  );
}

function decodeDependencies(value: LocalColumnValue): OutboxDependency[] {
  if (typeof value !== "string" || value.length === 0) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isDependency) : [];
  } catch {
    return [];
  }
}

function readEntityType(value: LocalColumnValue): OutboxEntityType {
  return isOneOf(ENTITY_TYPES, value) ? value : "transaction";
}

function readOperation(value: LocalColumnValue): OutboxOperation {
  return isOneOf(OPERATIONS, value) ? value : "update";
}

function readStatus(value: LocalColumnValue): OutboxStatus {
  return isOneOf(STATUSES, value) ? value : "pending";
}

/** Maps one `outbox` row to the domain mutation. */
export function outboxMutationFromRow(row: LocalRow): OutboxMutation {
  return {
    clientMutationId: readString(row, "clientMutationId"),
    ownerId: readString(row, "ownerId"),
    seq: readNumber(row, "seq"),
    entityType: readEntityType(row.entityType),
    entityId: readString(row, "entityId"),
    operation: readOperation(row.operation),
    baseRevision: readNumber(row, "baseRevision"),
    localSnapshot: decodeSnapshot(row.localSnapshot),
    serverSnapshot: decodeSnapshot(row.serverSnapshot),
    dependsOn: decodeDependencies(row.dependsOn),
    status: readStatus(row.status),
    attempts: readNumber(row, "attempts"),
    nextAttemptAt: readNullableString(row, "nextAttemptAt"),
    lastErrorCode: readNullableString(row, "lastErrorCode"),
    createdAt: readString(row, "createdAt"),
    updatedAt: readString(row, "updatedAt"),
  };
}

/** Maps a domain mutation to the scalar row persisted in `outbox`. */
export function outboxMutationToRow(mutation: OutboxMutation): LocalRow {
  return {
    clientMutationId: mutation.clientMutationId,
    ownerId: mutation.ownerId,
    seq: mutation.seq,
    entityType: mutation.entityType,
    entityId: mutation.entityId,
    operation: mutation.operation,
    baseRevision: mutation.baseRevision,
    localSnapshot: JSON.stringify(mutation.localSnapshot),
    serverSnapshot: JSON.stringify(mutation.serverSnapshot),
    dependsOn: JSON.stringify(mutation.dependsOn),
    status: mutation.status,
    attempts: mutation.attempts,
    nextAttemptAt: mutation.nextAttemptAt,
    lastErrorCode: mutation.lastErrorCode,
    createdAt: mutation.createdAt,
    updatedAt: mutation.updatedAt,
  };
}

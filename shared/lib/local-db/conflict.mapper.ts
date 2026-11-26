import type {
  LocalColumnValue,
  LocalConflict,
  LocalConflictKind,
  LocalConflictResolution,
  LocalRow,
  OutboxEntityType,
} from "./local-db.types";

const ENTITY_TYPES = ["wallet", "category", "transaction", "transfer"] as const;
const CONFLICT_KINDS = [
  "REMOTE_CHANGED",
  "DELETED_REMOTELY",
  "WALLET_UNAVAILABLE",
  "INSUFFICIENT_FUNDS",
  "INVALID",
] as const;
const RESOLUTIONS = ["keep-mine", "keep-remote"] as const;

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

function readNullableString(row: LocalRow, column: string): string | null {
  const value = row[column];
  return typeof value === "string" ? value : null;
}

function decodeSnapshot(value: LocalColumnValue): Record<string, unknown> {
  if (typeof value !== "string" || value.length === 0) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readEntityType(value: LocalColumnValue): OutboxEntityType {
  return isOneOf(ENTITY_TYPES, value) ? value : "transaction";
}

function readKind(value: LocalColumnValue): LocalConflictKind {
  return isOneOf(CONFLICT_KINDS, value) ? value : "INVALID";
}

function readResolution(
  value: LocalColumnValue,
): LocalConflictResolution | null {
  return isOneOf(RESOLUTIONS, value) ? value : null;
}

/** Maps one `conflicts` row to the domain record. */
export function conflictFromRow(row: LocalRow): LocalConflict {
  return {
    id: readString(row, "id"),
    ownerId: readString(row, "ownerId"),
    clientMutationId: readString(row, "clientMutationId"),
    entityType: readEntityType(row.entityType),
    entityId: readString(row, "entityId"),
    kind: readKind(row.kind),
    localSnapshot: decodeSnapshot(row.localSnapshot),
    remoteSnapshot: decodeSnapshot(row.remoteSnapshot),
    detectedAt: readString(row, "detectedAt"),
    resolvedAt: readNullableString(row, "resolvedAt"),
    resolution: readResolution(row.resolution),
  };
}

/** Maps a domain conflict to the scalar row persisted in `conflicts`. */
export function conflictToRow(conflict: LocalConflict): LocalRow {
  return {
    id: conflict.id,
    ownerId: conflict.ownerId,
    clientMutationId: conflict.clientMutationId,
    entityType: conflict.entityType,
    entityId: conflict.entityId,
    kind: conflict.kind,
    localSnapshot: JSON.stringify(conflict.localSnapshot),
    remoteSnapshot: JSON.stringify(conflict.remoteSnapshot),
    detectedAt: conflict.detectedAt,
    resolvedAt: conflict.resolvedAt,
    resolution: conflict.resolution,
  };
}

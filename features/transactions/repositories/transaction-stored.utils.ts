/**
 * Readers for the optional fields of a stored transaction document. They keep
 * malformed values from resurrecting a soft-deleted movement or from being
 * treated as a valid link.
 */

/**
 * Soft-delete stamp of a stored movement. A non-empty value keeps the record
 * out of the movements list, so it is never normalized away.
 */
export function readStoredDeletedAt(
  data: Record<string, unknown>,
): string | null {
  return typeof data.deletedAt === "string" && data.deletedAt.trim().length > 0
    ? data.deletedAt.trim()
    : null;
}

/** Stored `sharedExpenseId`, if any; personal movements never have one. */
export function readStoredSharedExpenseId(
  data: Record<string, unknown>,
): string | undefined {
  return readStoredLink(data.sharedExpenseId);
}

/** Stored `groupExpenseId`, if any; personal movements never have one. */
export function readStoredGroupExpenseId(
  data: Record<string, unknown>,
): string | undefined {
  return readStoredLink(data.groupExpenseId);
}

/** Stored `settlementId`, if any; only a settlement income can have one. */
export function readStoredSettlementId(
  data: Record<string, unknown>,
): string | undefined {
  return readStoredLink(data.settlementId);
}

/** Stored `groupSettlementId`, if any; only a settlement income can have one. */
export function readStoredGroupSettlementId(
  data: Record<string, unknown>,
): string | undefined {
  return readStoredLink(data.groupSettlementId);
}

function readStoredLink(value: unknown): string | undefined {
  const id = typeof value === "string" ? value.trim() : "";

  return id.length > 0 ? id : undefined;
}

/**
 * True when the movement is owned by a shared-expense, group-expense or
 * settlement feature; only that operation may revert and remove it.
 */
export function hasStoredMovementLink(data: Record<string, unknown>): boolean {
  return Boolean(
    readStoredSharedExpenseId(data) ??
      readStoredGroupExpenseId(data) ??
      readStoredSettlementId(data) ??
      readStoredGroupSettlementId(data),
  );
}

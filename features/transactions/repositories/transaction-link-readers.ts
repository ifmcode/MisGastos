import type { CreateTransactionDto } from "../types/transaction.types";

/**
 * Link readers of a transaction DTO. Each link is only valid on one type:
 * an expense carries the shared/group link, an income carries the settlement
 * link. A wrong-type value is dropped instead of rejecting the whole record.
 */
export function readSharedExpenseId(dto: CreateTransactionDto): string | null {
  if (dto.type !== "expense") return null;

  return readLink(dto.sharedExpenseId);
}

/** A group expense link is expense-only for the same reason as the 1:1 one. */
export function readGroupExpenseId(dto: CreateTransactionDto): string | null {
  if (dto.type !== "expense") return null;

  return readLink(dto.groupExpenseId);
}

/** A settlement income is the mirror case: the link belongs to an income. */
export function readSettlementId(dto: CreateTransactionDto): string | null {
  if (dto.type !== "income") return null;

  return readLink(dto.settlementId);
}

/** The group settlement mirror: an income-only link, like the 1:1 one. */
export function readGroupSettlementId(
  dto: CreateTransactionDto,
): string | null {
  if (dto.type !== "income") return null;

  return readLink(dto.groupSettlementId);
}

function readLink(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";

  return id.length > 0 ? id : null;
}

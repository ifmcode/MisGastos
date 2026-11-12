import { Category } from "../types/category.types";
import {
  CATEGORY_COLORS,
  getCategoryIconName,
  isCategoryType,
} from "../utils/category-options";

const EPOCH_ISO = new Date(0).toISOString();
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface TimestampLike {
  toDate(): Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as { toDate?: unknown };
  return typeof candidate.toDate === "function";
}

function toIsoDate(value: unknown): string | null {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (isTimestampLike(value)) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

/**
 * Converts a Firestore document into a Category. Invalid documents return
 * null so one malformed record cannot break the whole category list.
 */
export function mapCategoryDocument(
  id: string,
  data: Record<string, unknown>,
  ownerId: string,
): Category | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length === 0) return null;
  if (!isCategoryType(data.type)) return null;

  const icon = getCategoryIconName(
    typeof data.icon === "string" ? data.icon : "",
  );

  const color =
    typeof data.color === "string" && HEX_COLOR_PATTERN.test(data.color)
      ? data.color.toUpperCase()
      : CATEGORY_COLORS[0];

  const legacyId =
    typeof data.legacyId === "string" && data.legacyId.trim().length > 0
      ? data.legacyId.trim()
      : undefined;

  const sortOrder =
    typeof data.sortOrder === "number" &&
    Number.isFinite(data.sortOrder) &&
    data.sortOrder >= 0
      ? Math.floor(data.sortOrder)
      : undefined;

  const storedOwnerId =
    typeof data.ownerId === "string" && data.ownerId.trim().length > 0
      ? data.ownerId
      : ownerId;

  const createdAt = toIsoDate(data.createdAt) ?? EPOCH_ISO;
  const updatedAt = toIsoDate(data.updatedAt) ?? createdAt;

  return {
    id,
    name,
    icon,
    color,
    type: data.type,
    ownerId: storedOwnerId,
    createdAt,
    updatedAt,
    ...(sortOrder !== undefined ? { sortOrder } : {}),
    ...(legacyId ? { legacyId } : {}),
  };
}

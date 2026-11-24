import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import {
  readLocalRowId,
  readLocalRowOwnerId,
} from "@/shared/lib/local-db/local-row.readers";
import { toIsoTimestamp } from "@/shared/utils/date";

import { Category } from "../types/category.types";
import { mapCategoryDocument } from "./category.mapper";

const EPOCH_ISO = new Date(0).toISOString();

/**
 * Cache mapping for categories. The SQLite row is written by
 * `toCategoryLocalRow`; `fromCategoryLocalRow` rebuilds the Firestore-shaped
 * document and delegates to `mapCategoryDocument` so icon/colour sanitising and
 * validation are not duplicated.
 */
export function toCategoryLocalRow(category: Category): LocalRow {
  return {
    id: category.id,
    ownerId: category.ownerId,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    sortOrder: category.sortOrder ?? null,
    legacyId: category.legacyId ?? null,
    createdAt: toIsoTimestamp(category.createdAt) ?? EPOCH_ISO,
    updatedAt: toIsoTimestamp(category.updatedAt) ?? EPOCH_ISO,
    deletedAt: null,
    revision: category.revision,
    syncStatus: "synced",
  };
}

export function fromCategoryLocalRow(row: LocalRow): Category | null {
  const id = readLocalRowId(row);
  if (!id) return null;

  return mapCategoryDocument(
    id,
    {
      ownerId: row.ownerId,
      name: row.name,
      type: row.type,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sortOrder,
      legacyId: row.legacyId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      revision: row.revision,
    },
    readLocalRowOwnerId(row),
  );
}

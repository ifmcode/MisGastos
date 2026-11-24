import type { LocalRow } from "@/shared/lib/local-db/local-db.types";
import { LocalCacheMetaRepository } from "@/shared/lib/local-db/cache-meta.repository";
import { mirrorOwnerRows } from "@/shared/lib/local-db/cache-mirror";
import { getLocalDatabase } from "@/shared/lib/local-db/local-db.runtime";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { Category } from "../types/category.types";
import { compareCategories } from "../utils/category-order";
import {
  fromCategoryLocalRow,
  toCategoryLocalRow,
} from "./local-category.mapper";

const COLLECTION = "categories" as const;

/** Cached categories, or null when the flag is off, no port or no fetch. */
export async function readCachedCategories(
  ownerId: string,
): Promise<Category[] | null> {
  if (!isOfflineFirstEnabled()) return null;

  try {
    const port = await getLocalDatabase();
    if (!port) return null;

    const meta = new LocalCacheMetaRepository(port);
    if ((await meta.getFetchedAt(ownerId, COLLECTION)) === null) return null;

    const rows = await port.select<LocalRow>(COLLECTION, {
      where: { ownerId },
    });
    const categories = rows.flatMap((row) => {
      const category = fromCategoryLocalRow(row);
      return category ? [category] : [];
    });

    return categories.sort(compareCategories);
  } catch {
    return null;
  }
}

/** Mirrors the remote list and stamps the fetch in one local transaction. */
export async function cacheCategories(
  ownerId: string,
  categories: readonly Category[],
  now: string,
): Promise<void> {
  if (!isOfflineFirstEnabled()) return;

  const port = await getLocalDatabase();
  if (!port) return;

  const meta = new LocalCacheMetaRepository(port);

  await port.transaction(async (tx) => {
    await mirrorOwnerRows(tx, {
      table: COLLECTION,
      ownerId,
      rows: categories.map(toCategoryLocalRow),
      now,
    });
    await meta.markFetched(ownerId, COLLECTION, now, tx);
  });
}

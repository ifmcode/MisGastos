import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { readClientDocumentId } from "@/shared/utils/client-id";
import { INITIAL_REVISION, nextRevision } from "@/shared/utils/revision";

import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import {
  getNextSortOrder,
  type CategoryOrderUpdate,
} from "../utils/category-order";

export const CATEGORY_COLLECTION = "categories";

/** Payload shape of a category write; the owner and revision are explicit. */
export interface CategoryWriteData {
  name: string;
  icon: string;
  color: string;
  updatedAt: string;
  revision: number;
}

/**
 * Creates a category with the next display position. A provided client id
 * writes to that document; a blank one falls back to a generated reference.
 */
export async function createCategoryDocument(
  ownerId: string,
  dto: CreateCategoryDto,
  existing: readonly Category[],
): Promise<Category> {
  const now = new Date().toISOString();
  const data = {
    name: dto.name,
    icon: dto.icon,
    color: dto.color,
    type: dto.type,
    ownerId,
    sortOrder: getNextSortOrder(existing),
    revision: INITIAL_REVISION,
    createdAt: now,
    updatedAt: now,
  };

  const providedId = readClientDocumentId(dto.id);
  if (providedId) {
    await setDoc(doc(db, CATEGORY_COLLECTION, providedId), data);
    return { id: providedId, ...data };
  }

  const reference = await addDoc(
    collection(db, CATEGORY_COLLECTION),
    data,
  );

  return { id: reference.id, ...data };
}

/**
 * Updates the editable fields of a category and its revision. The stored
 * category (already read by the caller) supplies the base revision.
 */
export async function updateCategoryDocument(
  categoryId: string,
  dto: UpdateCategoryDto,
  stored: Category | null,
): Promise<CategoryWriteData> {
  const data: CategoryWriteData = {
    name: dto.name,
    icon: dto.icon,
    color: dto.color,
    updatedAt: new Date().toISOString(),
    revision: nextRevision(stored),
  };

  await updateDoc(doc(db, CATEGORY_COLLECTION, categoryId), { ...data });

  return data;
}

/**
 * Persists the reordered positions in one batch. The stored categories supply
 * each revision, so every document is bumped exactly once.
 */
export async function reorderCategoryDocuments(
  updates: readonly CategoryOrderUpdate[],
  stored: readonly Category[],
): Promise<void> {
  const now = new Date().toISOString();
  const storedById = new Map(stored.map((category) => [category.id, category]));
  const batch = writeBatch(db);
  let writes = 0;

  for (const update of updates) {
    const storedCategory = storedById.get(update.id);
    // A stale id has no known base revision; skipping it avoids writing a
    // guessed value that the rules would reject for the whole batch.
    if (!storedCategory) continue;

    batch.update(doc(db, CATEGORY_COLLECTION, update.id), {
      sortOrder: update.sortOrder,
      updatedAt: now,
      revision: nextRevision(storedCategory),
    });
    writes += 1;
  }

  if (writes === 0) return;

  await batch.commit();
}

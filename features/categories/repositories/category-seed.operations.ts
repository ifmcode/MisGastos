import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { INITIAL_REVISION } from "@/shared/utils/revision";

import type { Category, CreateCategoryDto } from "../types/category.types";
import {
  DEFAULT_CATEGORIES,
  getDefaultCategoryDocumentId,
} from "../utils/default-categories";
import { mapCategoryDocument } from "./category.mapper";
import { CATEGORY_COLLECTION } from "./category-write.operations";

/**
 * Creates a category under a deterministic id only when it is missing, so
 * concurrent devices resolve to one document and an existing (even renamed)
 * category is never rewritten.
 */
export async function ensureCategoryDocument(
  ownerId: string,
  categoryId: string,
  dto: CreateCategoryDto,
): Promise<Category> {
  const reference = doc(db, CATEGORY_COLLECTION, categoryId);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    const existing = mapCategoryDocument(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
      ownerId,
    );
    if (existing) return existing;
  }

  const now = new Date().toISOString();
  const data = {
    name: dto.name,
    icon: dto.icon,
    color: dto.color,
    type: dto.type,
    ownerId,
    revision: INITIAL_REVISION,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(reference, data);

  return { id: categoryId, ...data };
}

/** Writes the default category set under deterministic ids at revision 0. */
export async function writeDefaultCategories(
  ownerId: string,
): Promise<Category[]> {
  const baseTime = Date.now();
  const categories: Category[] = [];

  for (const [index, definition] of DEFAULT_CATEGORIES.entries()) {
    const id = getDefaultCategoryDocumentId(ownerId, definition.legacyId);
    const timestamp = new Date(baseTime + index).toISOString();
    const data = {
      name: definition.name,
      icon: definition.icon,
      color: definition.color,
      type: definition.type,
      legacyId: definition.legacyId,
      ownerId,
      sortOrder: index,
      revision: INITIAL_REVISION,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(doc(db, CATEGORY_COLLECTION, id), data);
    categories.push({ id, ...data });
  }

  return categories;
}

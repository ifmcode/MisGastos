import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import {
  compareCategories,
  getNextSortOrder,
  type CategoryOrderUpdate,
} from "../utils/category-order";
import {
  DEFAULT_CATEGORIES,
  getDefaultCategoryDocumentId,
} from "../utils/default-categories";
import { ICategoryRepository } from "./category.repository";
import { mapCategoryDocument } from "./category.mapper";

const CATEGORY_COLLECTION = "categories";

function sortCategories(categories: Category[]): Category[] {
  return categories.sort(compareCategories);
}

export class FirebaseCategoryRepository implements ICategoryRepository {
  async getCategories(ownerId: string): Promise<Category[]> {
    const categoriesRef = collection(db, CATEGORY_COLLECTION);
    const snapshot = await getDocs(
      query(categoriesRef, where("ownerId", "==", ownerId)),
    );

    const categories: Category[] = [];

    for (const document of snapshot.docs) {
      const category = mapCategoryDocument(
        document.id,
        document.data(),
        ownerId,
      );
      if (category) categories.push(category);
    }

    return sortCategories(categories);
  }

  async getCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<Category | null> {
    const categories = await this.getCategories(ownerId);
    return (
      categories.find(
        (category) =>
          category.id === categoryId || category.legacyId === categoryId,
      ) ?? null
    );
  }

  async createCategory(
    ownerId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const now = new Date().toISOString();
    const existing = await this.getCategories(ownerId);
    const data = {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      type: dto.type,
      ownerId,
      sortOrder: getNextSortOrder(existing),
      createdAt: now,
      updatedAt: now,
    };

    const categoriesRef = collection(db, CATEGORY_COLLECTION);
    const reference = await addDoc(categoriesRef, data);

    return { id: reference.id, ...data };
  }

  async updateCategory(
    ownerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const now = new Date().toISOString();
    const data = {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      updatedAt: now,
    };

    const categoryRef = doc(db, CATEGORY_COLLECTION, categoryId);
    await updateDoc(categoryRef, data);

    const category = await this.getCategory(ownerId, categoryId);
    if (!category) throw new Error("Category not found after update");

    return { ...category, ...data, ownerId };
  }

  async updateCategoryOrders(
    ownerId: string,
    updates: readonly CategoryOrderUpdate[],
  ): Promise<void> {
    void ownerId;
    if (updates.length === 0) return;

    const now = new Date().toISOString();
    const batch = writeBatch(db);

    for (const update of updates) {
      batch.update(doc(db, CATEGORY_COLLECTION, update.id), {
        sortOrder: update.sortOrder,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  async deleteCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<void> {
    void ownerId;
    await deleteDoc(doc(db, CATEGORY_COLLECTION, categoryId));
  }

  async seedDefaultCategories(ownerId: string): Promise<Category[]> {
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
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(doc(db, CATEGORY_COLLECTION, id), data);
      categories.push({ id, ...data });
    }

    return categories;
  }

  async countTransactionsUsingCategory(
    ownerId: string,
    categoryId: string,
    legacyId?: string,
  ): Promise<number> {
    const transactionsRef = collection(db, "transactions");
    const snapshot = await getDocs(
      query(transactionsRef, where("ownerId", "==", ownerId)),
    );

    return snapshot.docs.reduce((count, document) => {
      const usedCategoryId = document.data().categoryId;
      const matches =
        usedCategoryId === categoryId ||
        (Boolean(legacyId) && usedCategoryId === legacyId);
      return matches ? count + 1 : count;
    }, 0);
  }
}

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/category.types";
import { compareCategories, type CategoryOrderUpdate } from "../utils/category-order";
import { ICategoryRepository } from "./category.repository";
import { mapCategoryDocument } from "./category.mapper";
import {
  ensureCategoryDocument,
  writeDefaultCategories,
} from "./category-seed.operations";
import { countActiveTransactionsUsingCategory } from "./category-usage";
import {
  CATEGORY_COLLECTION,
  createCategoryDocument,
  reorderCategoryDocuments,
  updateCategoryDocument,
} from "./category-write.operations";

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
    const existing = await this.getCategories(ownerId);

    return createCategoryDocument(ownerId, dto, existing);
  }

  async updateCategory(
    ownerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const stored = await this.getCategory(ownerId, categoryId);
    const data = await updateCategoryDocument(categoryId, dto, stored);

    const category = await this.getCategory(ownerId, categoryId);
    if (!category) throw new Error("Category not found after update");

    return { ...category, ...data, ownerId };
  }

  async updateCategoryOrders(
    ownerId: string,
    updates: readonly CategoryOrderUpdate[],
  ): Promise<void> {
    if (updates.length === 0) return;

    const stored = await this.getCategories(ownerId);

    await reorderCategoryDocuments(updates, stored);
  }

  async deleteCategory(
    ownerId: string,
    categoryId: string,
  ): Promise<void> {
    void ownerId;
    await deleteDoc(doc(db, CATEGORY_COLLECTION, categoryId));
  }

  async ensureCategory(
    ownerId: string,
    categoryId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    return ensureCategoryDocument(ownerId, categoryId, dto);
  }

  async seedDefaultCategories(ownerId: string): Promise<Category[]> {
    return writeDefaultCategories(ownerId);
  }

  async countTransactionsUsingCategory(
    ownerId: string,
    categoryId: string,
    legacyId?: string,
  ): Promise<number> {
    return countActiveTransactionsUsingCategory(ownerId, categoryId, legacyId);
  }
}

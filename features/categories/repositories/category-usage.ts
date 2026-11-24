import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Counts the owner's movements that still use a category, by document id or by
 * legacy id. Soft-deleted movements are ignored so a reverted movement no
 * longer blocks deleting its category.
 */
export async function countActiveTransactionsUsingCategory(
  ownerId: string,
  categoryId: string,
  legacyId?: string,
): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(db, "transactions"),
      where("ownerId", "==", ownerId),
    ),
  );

  return snapshot.docs.reduce((count, document) => {
    const data = document.data();
    const deletedAt = data.deletedAt;
    const isDeleted =
      typeof deletedAt === "string" && deletedAt.trim().length > 0;
    if (isDeleted) return count;

    const usedCategoryId = data.categoryId;
    const matches =
      usedCategoryId === categoryId ||
      (Boolean(legacyId) && usedCategoryId === legacyId);
    return matches ? count + 1 : count;
  }, 0);
}

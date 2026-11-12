import { BaseEntity } from "@/shared/types/common.types";

export type CategoryType = "expense" | "income";

export interface Category extends BaseEntity {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  ownerId: string;
  /**
   * Manual display order chosen by the owner. Ascending, lower first.
   * Optional for documents created before ordering existed; those fall back
   * to `createdAt` and `name` until the owner reorders the list.
   */
  sortOrder?: number;
  /**
   * Id used by transactions created before categories moved to Firestore.
   * Kept so historical transactions can still be resolved.
   */
  legacyId?: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export type UpdateCategoryDto = Omit<CreateCategoryDto, "type">;

/** Raw values handled by the category form. */
export interface CategoryFormValues {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

import { FirebaseCategoryRepository } from "../repositories/firebase-category.repository";
import { CategoryService } from "./category.service";

let categoryServiceInstance: CategoryService | null = null;

export function getCategoryService(): CategoryService {
  if (!categoryServiceInstance) {
    const repository = new FirebaseCategoryRepository();
    categoryServiceInstance = new CategoryService(repository);
  }

  return categoryServiceInstance;
}

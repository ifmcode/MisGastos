import { useMemo, useState } from "react";

import { useCategories } from "./use-categories";
import { useCategoryMutations } from "./use-category-mutations";
import { CategoryInput } from "../schemas/category.schema";
import {
  Category,
  CategoryType,
  CategoryTypeFilter,
} from "../types/category.types";
import { showDeleteCategoryDialog } from "../utils/category-delete-dialog";
import { filterCategoriesByType } from "../utils/category-filters";

/** Orchestrates the categories screen state without rendering concerns. */
export function useCategoriesScreen() {
  const {
    categories,
    setCategories,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useCategories();
  const {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryMutations({ setCategories });

  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>("all");
  const [formCategory, setFormCategory] = useState<
    Category | null | undefined
  >(undefined);
  const [defaultType, setDefaultType] =
    useState<CategoryType>("expense");

  const visible = formCategory !== undefined;

  const visibleCategories = useMemo(
    () => filterCategoriesByType(categories, typeFilter),
    [categories, typeFilter],
  );

  function openCreate() {
    clearMutationState();
    setDefaultType(typeFilter === "income" ? "income" : "expense");
    setFormCategory(null);
  }

  function openEdit(category: Category) {
    clearMutationState();
    setFormCategory(category);
  }

  function close() {
    if (mutating) return;
    setFormCategory(undefined);
  }

  async function submit(input: CategoryInput) {
    const target = formCategory;
    const saved = target
      ? await updateCategory(target.id, input)
      : await createCategory(input);

    if (saved) setFormCategory(undefined);
  }

  function requestDelete() {
    const target = formCategory;
    if (!target) return;

    showDeleteCategoryDialog({
      category: target,
      onConfirm: async () => {
        const deleted = await deleteCategory(target.id);
        if (deleted) setFormCategory(undefined);
      },
    });
  }

  return {
    categories,
    visibleCategories,
    typeFilter,
    setTypeFilter,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    mutating,
    mutationError,
    mutationFieldErrors,
    visible,
    formCategory,
    defaultType,
    openCreate,
    openEdit,
    close,
    submit,
    requestDelete,
  };
}

import { useMemo, useState } from "react";

import { useCategories } from "./use-categories";
import { useCategoryMutations } from "./use-category-mutations";
import { useCategoryReorder } from "./use-category-reorder";
import { CategoryInput } from "../schemas/category.schema";
import { Category, CategoryType } from "../types/category.types";
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

  const [typeFilter, setTypeFilter] = useState<CategoryType>("expense");
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

  const reorder = useCategoryReorder({
    categories,
    visibleCategories,
    setCategories,
  });

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

  async function deleteEditing() {
    const target = formCategory;
    if (!target) return;

    const deleted = await deleteCategory(target.id);
    if (deleted) setFormCategory(undefined);
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
    reorder,
    openCreate,
    openEdit,
    close,
    submit,
    deleteEditing,
  };
}

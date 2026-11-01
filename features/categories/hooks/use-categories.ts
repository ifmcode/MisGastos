import { Dispatch, SetStateAction, useCallback } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAsyncCollection } from "@/shared/hooks/use-async-collection";

import { getCategoryErrorMessage } from "../services/category.errors";
import { Category } from "../types/category.types";
import { useCategoryService } from "./use-category-service";

export interface UseCategoriesResult {
  categories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  addCategory: (category: Category) => void;
}

/** Loads the owner's categories and seeds defaults on first use. */
export function useCategories(): UseCategoriesResult {
  const { user } = useAuth();
  const categoryService = useCategoryService();

  const loadCategories = useCallback(
    (ownerId: string) => categoryService.getCategories(ownerId),
    [categoryService],
  );
  const describeLoadError = useCallback(
    (error: unknown) =>
      getCategoryErrorMessage(
        error,
        "No se pudieron cargar las categorías. Inténtalo de nuevo.",
      ),
    [],
  );

  const { items, setItems, loading, refreshing, error, reload, refresh } =
    useAsyncCollection<Category>({
      ownerId: user?.uid,
      load: loadCategories,
      describeError: describeLoadError,
    });

  const addCategory = useCallback(
    (category: Category) => {
      setItems((current) => [...current, category]);
    },
    [setItems],
  );

  return {
    categories: items,
    setCategories: setItems,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    addCategory,
  };
}

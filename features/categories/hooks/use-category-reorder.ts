import {
  Dispatch,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { getCategoryErrorCode } from "../services/category.errors";
import { Category } from "../types/category.types";
import { CategoryMoveDirection, moveCategory } from "../utils/category-order";
import { useCategoryService } from "./use-category-service";

export interface UseCategoryReorderOptions {
  categories: Category[];
  visibleCategories: Category[];
  setCategories: Dispatch<SetStateAction<Category[]>>;
}

export interface CategoryReorder {
  reordering: boolean;
  saving: boolean;
  error: string | null;
  toggleReorder: () => void;
  move: (categoryId: string, direction: CategoryMoveDirection) => void;
}

/**
 * Owns the manual reorder mode. Each move applies optimistically and is
 * reverted when the persistence call fails.
 */
export function useCategoryReorder({
  categories,
  visibleCategories,
  setCategories,
}: UseCategoryReorderOptions): CategoryReorder {
  const { user } = useAuth();
  const { t, tr } = useScopedTranslation("categories");
  const categoryService = useCategoryService();
  const [reordering, setReordering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const toggleReorder = useCallback(() => {
    if (savingRef.current) return;
    setError(null);
    setReordering((current) => !current);
  }, []);

  const move = useCallback(
    (categoryId: string, direction: CategoryMoveDirection) => {
      if (savingRef.current) return;

      if (!user) {
        setError(t("errors.SIGN_IN_REORDER"));
        return;
      }

      const result = moveCategory(
        categories,
        categoryId,
        direction,
        visibleCategories.map((category) => category.id),
      );
      if (!result) return;

      const previous = categories;
      const orderedIds = result.categories.map((category) => category.id);

      savingRef.current = true;
      setCategories(result.categories);
      setSaving(true);
      setError(null);

      void categoryService
        .reorderCategories(user.uid, orderedIds)
        .catch((failure: unknown) => {
          setCategories(previous);
          setError(
            tr(`errors.${getCategoryErrorCode(failure, "REORDER_FAILED")}`),
          );
        })
        .finally(() => {
          savingRef.current = false;
          setSaving(false);
        });
    },
    [user, categories, visibleCategories, setCategories, categoryService, tr],
  );

  return {
    reordering,
    saving,
    error,
    toggleReorder,
    move,
  };
}

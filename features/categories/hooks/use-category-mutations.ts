import {
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from "react";

import { useAuth } from "@/hooks/use-auth";

import {
  CategoryInput,
  CategoryValidationErrors,
} from "../schemas/category.schema";
import {
  CategoryValidationError,
  getCategoryErrorMessage,
} from "../services/category.errors";
import { Category } from "../types/category.types";
import { useCategoryService } from "./use-category-service";

export interface UseCategoryMutationsOptions {
  setCategories: Dispatch<SetStateAction<Category[]>>;
}

export interface CategoryMutations {
  mutating: boolean;
  mutationError: string | null;
  mutationFieldErrors: CategoryValidationErrors;
  clearMutationState: () => void;
  createCategory: (input: CategoryInput) => Promise<boolean>;
  updateCategory: (
    categoryId: string,
    input: CategoryInput,
  ) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
}

/** Owns the category CRUD flows and their error state. */
export function useCategoryMutations({
  setCategories,
}: UseCategoryMutationsOptions): CategoryMutations {
  const { user } = useAuth();
  const categoryService = useCategoryService();

  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationFieldErrors, setMutationFieldErrors] =
    useState<CategoryValidationErrors>({});

  const clearMutationState = useCallback(() => {
    setMutationError(null);
    setMutationFieldErrors({});
  }, []);

  const fail = useCallback((failure: unknown): false => {
    if (failure instanceof CategoryValidationError) {
      setMutationFieldErrors(failure.fieldErrors);
      setMutationError(failure.message);
    } else {
      setMutationError(
        getCategoryErrorMessage(
          failure,
          "No se pudo completar la operación. Inténtalo de nuevo.",
        ),
      );
    }

    return false;
  }, []);

  const run = useCallback(
    async (
      operation: (ownerId: string) => Promise<void>,
      unauthenticatedMessage: string,
    ): Promise<boolean> => {
      if (!user) {
        setMutationError(unauthenticatedMessage);
        return false;
      }

      setMutating(true);
      clearMutationState();

      try {
        await operation(user.uid);
        return true;
      } catch (failure: unknown) {
        return fail(failure);
      } finally {
        setMutating(false);
      }
    },
    [user, clearMutationState, fail],
  );

  const createCategory = useCallback(
    (input: CategoryInput) =>
      run(async (ownerId) => {
        const category = await categoryService.createCategory(ownerId, input);
        setCategories((current) => [...current, category]);
      }, "Debes iniciar sesión para crear una categoría."),
    [run, categoryService, setCategories],
  );

  const updateCategory = useCallback(
    (categoryId: string, input: CategoryInput) =>
      run(async (ownerId) => {
        const category = await categoryService.updateCategory(
          ownerId,
          categoryId,
          input,
        );
        setCategories((current) =>
          current.map((item) =>
            item.id === category.id ? category : item,
          ),
        );
      }, "Debes iniciar sesión para editar una categoría."),
    [run, categoryService, setCategories],
  );

  const deleteCategory = useCallback(
    (categoryId: string) =>
      run(async (ownerId) => {
        await categoryService.deleteCategory(ownerId, categoryId);
        setCategories((current) =>
          current.filter((category) => category.id !== categoryId),
        );
      }, "Debes iniciar sesión para eliminar una categoría."),
    [run, categoryService, setCategories],
  );

  return {
    mutating,
    mutationError,
    mutationFieldErrors,
    clearMutationState,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

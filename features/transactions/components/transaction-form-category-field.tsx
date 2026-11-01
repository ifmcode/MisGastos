import { CategoryFormModal } from "@/features/categories/components/category-form-modal";
import { useCategoryCreator } from "@/features/categories/hooks/use-category-creator";
import { CategoryInput } from "@/features/categories/schemas/category.schema";
import { Category } from "@/features/categories/types/category.types";

import { TransactionType } from "../types/transaction.types";
import { TransactionCategory } from "../utils/transaction-options";
import { TransactionFormCategorySelector } from "./transaction-form-category-selector";

export interface TransactionFormCategoryFieldProps {
  categories: readonly TransactionCategory[];
  value: string;
  type: TransactionType;
  error?: string;
  disabled: boolean;
  onChange: (categoryId: string) => void;
  onCategoryCreated?: (category: Category) => void;
}

/**
 * Category picker plus the inline creation modal. Keeping both together lets
 * the transaction form create a category without leaving the flow.
 */
export function TransactionFormCategoryField({
  categories,
  value,
  type,
  error,
  disabled,
  onChange,
  onCategoryCreated,
}: TransactionFormCategoryFieldProps) {
  const creator = useCategoryCreator();

  async function createCategory(input: CategoryInput) {
    const created = await creator.create(input);
    if (!created) return;

    onCategoryCreated?.(created);
    onChange(created.id);
    creator.close();
  }

  return (
    <>
      <TransactionFormCategorySelector
        categories={categories}
        value={value}
        error={error}
        disabled={disabled}
        onChange={onChange}
        onCreate={() => creator.open(type)}
      />

      <CategoryFormModal
        visible={creator.visible}
        category={null}
        defaultType={creator.defaultType}
        lockType
        presentationStyle="overFullScreen"
        submitting={creator.submitting}
        error={creator.error}
        fieldErrors={creator.fieldErrors}
        onSubmit={(input) => void createCategory(input)}
        onClose={creator.close}
      />
    </>
  );
}

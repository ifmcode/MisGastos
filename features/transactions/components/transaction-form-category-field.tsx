import { useState } from "react";

import { CategoryFormModal } from "@/features/categories/components/category-form-modal";
import { useCategoryCreator } from "@/features/categories/hooks/use-category-creator";
import { CategoryInput } from "@/features/categories/schemas/category.schema";
import { Category } from "@/features/categories/types/category.types";

import { TransactionType } from "../types/transaction.types";
import { TransactionCategory } from "../utils/transaction-options";
import { TransactionCategoryPickerDialog } from "./transaction-category-picker-dialog";
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
 * Compact category picker, its full-category popup and the inline creation
 * modal. Keeping them together lets the form create and select a category
 * without leaving the movement flow.
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
  const [pickerVisible, setPickerVisible] = useState(false);

  function selectCategory(categoryId: string) {
    onChange(categoryId);
    setPickerVisible(false);
  }

  function openCreator() {
    setPickerVisible(false);
    creator.open(type);
  }

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
        onOpenPicker={() => setPickerVisible(true)}
      />

      <TransactionCategoryPickerDialog
        visible={pickerVisible}
        categories={categories}
        value={value}
        disabled={disabled}
        onSelect={selectCategory}
        onCreate={openCreator}
        onClose={() => setPickerVisible(false)}
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

import { useTranslation } from "react-i18next";

import type { Category } from "@/features/categories/types/category.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { asTranslate } from "@/shared/i18n/translate";

import type { UseTransactionFormResult } from "../hooks/use-transaction-form";
import {
  getFirstTransactionFieldError,
  getTransactionFieldErrorText,
} from "../utils/transaction-field-error";
import { TransactionFormActions } from "./transaction-form-actions";
import { TransactionFormAmountField } from "./transaction-form-amount-field";
import { TransactionFormCategoryField } from "./transaction-form-category-field";
import { TransactionFormConceptField } from "./transaction-form-concept-field";
import { TransactionFormDateField } from "./transaction-form-date-field";
import { TransactionFormNotesField } from "./transaction-form-notes-field";
import { TransactionFormNotice } from "./transaction-form-notice";
import { TransactionFormTypeSelector } from "./transaction-form-type-selector";
import { TransactionFormWalletField } from "./transaction-form-wallet-field";

export interface TransactionFormBodyProps {
  /** Values, derived options and handlers owned by the form hook. */
  form: UseTransactionFormResult;
  wallets: readonly Wallet[];
  /** Already translated service error. */
  error?: string | null;
  submitting: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  onCategoryCreated?: (category: Category) => void;
}

/** Scrollable body of the movement form: fields, notice and actions. */
export function TransactionFormBody({
  form,
  wallets,
  error,
  submitting,
  isEditing,
  onCancel,
  onDelete,
  onCategoryCreated,
}: TransactionFormBodyProps) {
  const { t } = useTranslation(["transactions", "validation"]);
  const { values, errors, categories, symbol, updateValue, selectDate, submit } =
    form;
  const firstFieldError = getFirstTransactionFieldError(errors);
  const fieldErrorText = firstFieldError
    ? getTransactionFieldErrorText(firstFieldError, asTranslate(t))
    : null;
  // A service error is specific and wins; a field error is only a notice
  // because its own field already shows the same message inline.
  const notice = error ?? fieldErrorText;

  return (
    <>
      <ErrorBanner message={error} />

      <TransactionFormTypeSelector
        value={values.type}
        disabled={submitting}
        onChange={(type) => updateValue("type", type)}
      />

      <TransactionFormAmountField
        value={values.amount}
        symbol={symbol}
        error={errors.amount}
        disabled={submitting}
        onChange={(value) => updateValue("amount", value)}
      />

      <TransactionFormWalletField
        wallets={wallets}
        value={values.walletId}
        error={errors.walletId}
        disabled={submitting}
        onChange={(walletId) => updateValue("walletId", walletId)}
      />

      <TransactionFormCategoryField
        categories={categories}
        value={values.categoryId}
        type={values.type}
        error={errors.categoryId}
        disabled={submitting}
        onChange={(categoryId) => updateValue("categoryId", categoryId)}
        onCategoryCreated={onCategoryCreated}
      />

      <TransactionFormConceptField
        value={values.concept}
        error={errors.concept}
        disabled={submitting}
        onChange={(value) => updateValue("concept", value)}
      />

      <TransactionFormDateField
        valueIso={values.date}
        error={errors.date}
        disabled={submitting}
        onSelectDate={selectDate}
      />

      <TransactionFormNotesField
        value={values.notes}
        error={errors.notes}
        disabled={submitting}
        onChange={(value) => updateValue("notes", value)}
      />

      {notice ? (
        <TransactionFormNotice
          text={notice}
          tone={error ? "error" : "notice"}
        />
      ) : null}

      <TransactionFormActions
        submitting={submitting}
        isEditing={isEditing}
        onCancel={onCancel}
        onSubmit={submit}
        onDelete={onDelete}
      />
    </>
  );
}

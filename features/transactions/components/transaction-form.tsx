import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { Category } from "@/features/categories/types/category.types";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useTransactionForm } from "../hooks/use-transaction-form";
import {
  TransactionInput,
  TransactionValidationErrors,
} from "../schemas/transaction.schema";
import { transactionFormStyles as styles } from "../styles/transaction-form.styles";
import { TransactionFormValues } from "../types/transaction.types";
import { TransactionFormActions } from "./transaction-form-actions";
import { TransactionFormAmountField } from "./transaction-form-amount-field";
import { TransactionFormCategoryField } from "./transaction-form-category-field";
import { TransactionFormConceptField } from "./transaction-form-concept-field";
import { TransactionFormDateField } from "./transaction-form-date-field";
import { TransactionFormErrorBanner } from "./transaction-form-error-banner";
import { TransactionFormHeader } from "./transaction-form-header";
import { TransactionFormNotesField } from "./transaction-form-notes-field";
import { TransactionFormTypeSelector } from "./transaction-form-type-selector";
import { TransactionFormWalletField } from "./transaction-form-wallet-field";

export interface TransactionFormProps {
  submitting: boolean;
  error?: string | null;
  fieldErrors?: TransactionValidationErrors;
  wallets: Wallet[];
  categories: readonly Category[];
  initialValues: TransactionFormValues;
  isEditing: boolean;
  onSubmit: (input: TransactionInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onCategoryCreated?: (category: Category) => void;
}

export function TransactionForm({
  submitting,
  error,
  fieldErrors = {},
  wallets,
  categories,
  initialValues,
  isEditing,
  onSubmit,
  onCancel,
  onDelete,
  onCategoryCreated,
}: TransactionFormProps) {
  const theme = useFormTheme();
  const { values, errors, categories: typeCategories, dateText, symbol, updateValue, changeDate, submit } =
    useTransactionForm({ wallets, categories, initialValues, fieldErrors, onSubmit });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <TransactionFormHeader
            isEditing={isEditing}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TransactionFormErrorBanner error={error} />

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
              categories={typeCategories}
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
              text={dateText}
              value={values.date}
              error={errors.date}
              disabled={submitting}
              onChange={changeDate}
            />

            <TransactionFormNotesField
              value={values.notes}
              error={errors.notes}
              disabled={submitting}
              onChange={(value) => updateValue("notes", value)}
            />

            <TransactionFormActions
              submitting={submitting}
              isEditing={isEditing}
              canSubmit={wallets.length > 0}
              onCancel={onCancel}
              onSubmit={submit}
              onDelete={onDelete}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

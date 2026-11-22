import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
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
import { TransactionFormBody } from "./transaction-form-body";
import { TransactionFormHeader } from "./transaction-form-header";

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

/** Page sheet of the movement form; it only orchestrates header and body. */
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
  const form = useTransactionForm({
    wallets,
    categories,
    initialValues,
    fieldErrors,
    onSubmit,
  });

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
            <TransactionFormBody
              form={form}
              wallets={wallets}
              error={error}
              submitting={submitting}
              isEditing={isEditing}
              onCancel={onCancel}
              onDelete={onDelete}
              onCategoryCreated={onCategoryCreated}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

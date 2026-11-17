import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import type { Category } from "@/features/categories/types/category.types";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Wallet } from "@/features/wallets/types/wallet.types";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { useSharedExpenseForm } from "../hooks/use-shared-expense-form";
import type { SharedExpenseFieldErrors } from "../schemas/shared-expense.schema";
import { sharedExpensesStyles as styles } from "../styles/shared-expenses.styles";
import type { SharedExpenseInput } from "../types/shared-expense.types";
import type { SharedExpenseFormValues } from "../utils/shared-expense-form";
import { SharedExpenseFormBody } from "./shared-expense-form-body";

export interface SharedExpenseFormProps {
  friends: readonly Friend[];
  /** Owner wallets and categories of the payer's linked movement. */
  wallets: readonly Wallet[];
  categories: readonly Category[];
  initialValues: SharedExpenseFormValues;
  fieldErrors: SharedExpenseFieldErrors;
  error: string | null;
  submitting: boolean;
  isEditing: boolean;
  /** Locked friend on create: the entry point already resolved the pair. */
  friendLocked?: boolean;
  onSubmit: (input: SharedExpenseInput) => void;
  onCancel: () => void;
}

/** Page sheet of the shared-expense form; owns the field state. */
export function SharedExpenseForm({
  friends,
  wallets,
  categories,
  initialValues,
  fieldErrors,
  error,
  submitting,
  isEditing,
  friendLocked,
  onSubmit,
  onCancel,
}: SharedExpenseFormProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("sharedExpenses");
  const form = useSharedExpenseForm({
    initialValues,
    fieldErrors,
    wallets,
    onSubmit,
  });
  const locked = isEditing || friendLocked === true;
  const lockedReason =
    friendLocked === true && !isEditing ? "preselected" : "editing";

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <FormHeader
            title={isEditing ? t("form.editTitle") : t("form.createTitle")}
            subtitle={t("form.subtitle")}
            closeAccessibilityLabel={t("form.closeAccessibility")}
            disabled={submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SharedExpenseFormBody
              form={form}
              friends={friends}
              wallets={wallets}
              categories={categories}
              error={error}
              submitting={submitting}
              isEditing={isEditing}
              locked={locked}
              lockedReason={lockedReason}
              onCancel={onCancel}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

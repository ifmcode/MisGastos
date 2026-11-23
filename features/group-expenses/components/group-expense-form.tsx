import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupExpenseEditorController } from "../hooks/use-group-expense-editor";
import { useGroupExpenseForm } from "../hooks/use-group-expense-form";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupExpenseFormBody } from "./group-expense-form-body";

export interface GroupExpenseFormProps {
  editor: GroupExpenseEditorController;
  onCancel: () => void;
}

/**
 * Page sheet of the group-expense form; owns the field state. The modal
 * remounts it when the group or its members change, so the defaults are always
 * derived from the group currently selected.
 */
export function GroupExpenseForm({ editor, onCancel }: GroupExpenseFormProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const isEditing = editor.editingExpense !== null;
  const form = useGroupExpenseForm({
    initialValues: editor.initialValues,
    fieldErrors: editor.fieldErrors,
    wallets: editor.wallets,
    onSubmit: editor.submit,
  });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.flex}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <FormHeader
            title={isEditing ? t("form.editTitle") : t("form.createTitle")}
            subtitle={t("form.subtitle")}
            closeAccessibilityLabel={t("form.closeAccessibility")}
            disabled={editor.submitting}
            onClose={onCancel}
          />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <GroupExpenseFormBody
              form={form}
              editor={editor}
              error={editor.formError}
              submitting={editor.submitting}
              isEditing={isEditing}
              onCancel={onCancel}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

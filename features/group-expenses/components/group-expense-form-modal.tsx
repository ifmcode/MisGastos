import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormHeader } from "@/shared/components/molecules/form-header";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupExpenseEditorController } from "../hooks/use-group-expense-editor";
import { groupExpensesStyles as styles } from "../styles/group-expenses.styles";
import { GroupExpenseForm } from "./group-expense-form";
import { GroupExpenseGroupPickerDialog } from "./group-expense-group-picker-dialog";

export interface GroupExpenseFormModalProps {
  editor: GroupExpenseEditorController;
}

/**
 * Page-sheet wrapper of the group-expense editor. The picker lives outside the
 * sheet: the movements entry point opens it first, so the picker and the sheet
 * are never presented at the same time. A picked group has no members yet, so
 * the sheet keeps its header and shows the member loading and its retry.
 */
export function GroupExpenseFormModal({
  editor,
}: GroupExpenseFormModalProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groupExpenses");
  const { t: common } = useTranslation("common");
  const isEditing = editor.editingExpense !== null;
  const membersPending = editor.membersLoading || editor.membersError !== null;

  return (
    <>
      <PageSheetFormModal
        visible={editor.formVisible}
        onRequestClose={editor.closeForm}
        onDismiss={editor.closeForm}
      >
        {membersPending ? (
          <SafeAreaView
            style={[styles.flex, { backgroundColor: theme.background }]}
          >
            <FormHeader
              title={isEditing ? t("form.editTitle") : t("form.createTitle")}
              subtitle={t("form.subtitle")}
              closeAccessibilityLabel={t("form.closeAccessibility")}
              disabled={false}
              onClose={editor.closeForm}
            />

            {editor.membersLoading ? (
              <LoadingState message={t("form.membersLoading")} />
            ) : (
              <ErrorState
                title={t("form.membersErrorTitle")}
                message={editor.membersError ?? ""}
                retryLabel={common("actions.retry")}
                retryAccessibilityLabel={t("form.membersRetryAccessibility")}
                onRetry={editor.retryMembers}
              />
            )}
          </SafeAreaView>
        ) : (
          <GroupExpenseForm
            key={editor.formKey}
            editor={editor}
            onCancel={editor.closeForm}
          />
        )}
      </PageSheetFormModal>

      <GroupExpenseGroupPickerDialog
        visible={editor.groupPickerVisible}
        groups={editor.groups}
        selectedId={editor.groupId}
        onSelect={editor.selectGroup}
        onClose={editor.closeGroupPicker}
      />
    </>
  );
}

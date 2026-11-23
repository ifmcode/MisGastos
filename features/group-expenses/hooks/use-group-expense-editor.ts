import { useCallback, useState } from "react";

import type { GroupExpense } from "../types/group-expense.types";
import { useGroupExpenseEditorMembers } from "./use-group-expense-editor-members";
import { useGroupExpenseEditorResources } from "./use-group-expense-editor-resources";
import { useGroupExpenseEditorSubmit } from "./use-group-expense-editor-submit";
import type {
  GroupExpenseEditorController,
  UseGroupExpenseEditorOptions,
} from "./use-group-expense-editor.types";
import { useGroupExpenseEditorValues } from "./use-group-expense-editor-values";

export type {
  GroupExpenseEditorController,
  UseGroupExpenseEditorOptions,
} from "./use-group-expense-editor.types";

/**
 * Create/edit orchestration of the page sheet: the visible group, its members,
 * the picker state and the submit error mapping. The group picker is owned here
 * so the form field and the movements entry point share one dialog.
 */
export function useGroupExpenseEditor({
  viewerUid,
  groups,
  lockedDetail,
  preferredCurrency,
  registerInWalletByDefault = false,
  onSaved,
}: UseGroupExpenseEditorOptions): GroupExpenseEditorController {
  const lockedGroupId = lockedDetail?.group.id ?? "";
  const [formVisible, setFormVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(
    null,
  );
  const [selectedGroupId, setSelectedGroupId] = useState(lockedGroupId);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);

  const resources = useGroupExpenseEditorResources();
  const membersState = useGroupExpenseEditorMembers({
    viewerUid,
    lockedDetail,
    groupId: selectedGroupId,
    enabled: formVisible,
  });
  const lockedGroup =
    lockedDetail && lockedDetail.group.id === selectedGroupId
      ? lockedDetail.group
      : undefined;
  const group =
    groups.find((item) => item.id === selectedGroupId) ?? lockedGroup;
  const values = useGroupExpenseEditorValues({
    editingExpense,
    viewerUid,
    groupId: selectedGroupId,
    memberIds: membersState.memberIds,
    groupCurrency: group?.defaultCurrency ?? preferredCurrency,
    registerInWalletByDefault,
    wallets: resources.wallets,
    walletsLoading: resources.walletsLoading,
    walletsError: resources.walletsError,
  });

  const handleSaved = useCallback(() => {
    setFormVisible(false);
    setEditingExpense(null);
    onSaved();
  }, [onSaved]);

  const submitState = useGroupExpenseEditorSubmit({
    viewerUid,
    editingExpense,
    onResourcesChanged: resources.refreshResources,
    onSaved: handleSaved,
  });
  const { resetErrors } = submitState;

  const openCreate = useCallback(() => {
    setEditingExpense(null);
    setSelectedGroupId(lockedGroupId);
    resetErrors();
    setFormVisible(true);
  }, [lockedGroupId, resetErrors]);

  const openEdit = useCallback(
    (expense: GroupExpense) => {
      setEditingExpense(expense);
      setSelectedGroupId(expense.groupId);
      resetErrors();
      setFormVisible(true);
    },
    [resetErrors],
  );

  const closeForm = useCallback(() => {
    if (submitState.submitting) return;

    setFormVisible(false);
    setEditingExpense(null);
    setGroupPickerVisible(false);
  }, [submitState.submitting]);

  const selectGroup = useCallback(
    (groupId: string) => {
      setSelectedGroupId(groupId);
      setGroupPickerVisible(false);
      resetErrors();
      // The movements entry point opens the picker before the sheet, so a
      // picked group is what brings the form up.
      setFormVisible(true);
    },
    [resetErrors],
  );

  const openGroupPicker = useCallback(() => setGroupPickerVisible(true), []);
  const closeGroupPicker = useCallback(() => setGroupPickerVisible(false), []);

  return {
    formVisible,
    editingExpense,
    initialValues: values.initialValues,
    formKey: values.formKey,
    formError: submitState.formError,
    fieldErrors: submitState.fieldErrors,
    submitting: submitState.submitting,
    groupId: selectedGroupId,
    groupName: group?.name ?? "",
    groupLocked: editingExpense !== null || lockedDetail !== null,
    groupPickerVisible,
    groups,
    members: membersState.members,
    memberIds: membersState.memberIds,
    membersLoading: membersState.loading,
    membersError: membersState.error,
    retryMembers: membersState.retry,
    wallets: resources.wallets,
    categories: resources.categories,
    openCreate,
    openEdit,
    closeForm,
    openGroupPicker,
    closeGroupPicker,
    selectGroup,
    submit: submitState.submit,
  };
}

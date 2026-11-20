import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_CURRENCY,
  resolveCurrencyCode,
  type CurrencyCode,
} from "@/shared/constants/currencies";

import type { GroupValidationErrors } from "../schemas/group.schema";
import type { Group } from "../types/group.types";
import {
  getInitialGroupFormValues,
  type GroupFormValues,
} from "../utils/group-form";
import { useGroupEditorSubmit } from "./use-group-editor-submit";

export interface UseGroupEditorOptions {
  viewerUid: string | undefined;
  /** Default currency of a new group; falls back to EUR when unavailable. */
  preferredCurrency: CurrencyCode | undefined;
  /** Reloads the list or the detail after a successful save. */
  onSaved: () => void;
}

export interface GroupEditorController {
  formVisible: boolean;
  editingGroup: Group | null;
  initialValues: GroupFormValues;
  formError: string | null;
  fieldErrors: GroupValidationErrors;
  submitting: boolean;
  openCreate: () => void;
  openEdit: (group: Group) => void;
  closeForm: () => void;
  submit: (values: GroupFormValues) => void;
}

/** Create/edit orchestration of the group page sheet and its error mapping. */
export function useGroupEditor({
  viewerUid,
  preferredCurrency,
  onSaved,
}: UseGroupEditorOptions): GroupEditorController {
  const [formVisible, setFormVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const initialValues = useMemo<GroupFormValues>(() => {
    if (editingGroup) return getInitialGroupFormValues(editingGroup);

    return {
      ...getInitialGroupFormValues(),
      defaultCurrency: resolveCurrencyCode(
        preferredCurrency ?? DEFAULT_CURRENCY,
      ),
    };
  }, [editingGroup, preferredCurrency]);

  const handleSaved = useCallback(() => {
    setFormVisible(false);
    setEditingGroup(null);
    onSaved();
  }, [onSaved]);

  const submitState = useGroupEditorSubmit({
    viewerUid,
    editingGroup,
    onSaved: handleSaved,
  });
  const { resetErrors } = submitState;

  const openCreate = useCallback(() => {
    setEditingGroup(null);
    resetErrors();
    setFormVisible(true);
  }, [resetErrors]);

  const openEdit = useCallback(
    (group: Group) => {
      setEditingGroup(group);
      resetErrors();
      setFormVisible(true);
    },
    [resetErrors],
  );

  const closeForm = useCallback(() => {
    if (submitState.submitting) return;

    setFormVisible(false);
    setEditingGroup(null);
  }, [submitState.submitting]);

  return {
    formVisible,
    editingGroup,
    initialValues,
    formError: submitState.formError,
    fieldErrors: submitState.fieldErrors,
    submitting: submitState.submitting,
    openCreate,
    openEdit,
    closeForm,
    submit: submitState.submit,
  };
}

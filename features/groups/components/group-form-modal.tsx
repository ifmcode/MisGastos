import type { Friend } from "@/features/friends/types/friend.types";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";

import type { GroupValidationErrors } from "../schemas/group-validation.types";
import type { GroupFormValues } from "../utils/group-form";
import { GroupForm } from "./group-form";

export interface GroupFormModalProps {
  visible: boolean;
  isEditing: boolean;
  initialValues: GroupFormValues;
  friends: readonly Friend[];
  fieldErrors: GroupValidationErrors;
  error: string | null;
  submitting: boolean;
  onSubmit: (values: GroupFormValues) => void;
  onClose: () => void;
}

/** Create/edit page sheet; the Social tab and the group detail share it. */
export function GroupFormModal({
  visible,
  isEditing,
  initialValues,
  friends,
  fieldErrors,
  error,
  submitting,
  onSubmit,
  onClose,
}: GroupFormModalProps) {
  return (
    <PageSheetFormModal visible={visible} onRequestClose={onClose}>
      <GroupForm
        isEditing={isEditing}
        initialValues={initialValues}
        friends={friends}
        fieldErrors={fieldErrors}
        error={error}
        submitting={submitting}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </PageSheetFormModal>
  );
}

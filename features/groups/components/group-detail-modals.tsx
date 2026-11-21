import type { Friend } from "@/features/friends/types/friend.types";
import { GroupExpenseFormModal } from "@/features/group-expenses/components/group-expense-form-modal";
import type { GroupExpenseEditorController } from "@/features/group-expenses/hooks/use-group-expense-editor";

import type { GroupEditorController } from "../hooks/use-group-editor";
import type { GroupInviteMembersController } from "../hooks/use-group-invite-members";
import type { GroupJoinCodeController } from "../hooks/use-group-join-code";
import type { GroupMemberActionsController } from "../hooks/use-group-member-actions";
import type { GroupDetail } from "../types/group.types";
import { GroupDetailsModal } from "./group-details-modal";
import { GroupFormModal } from "./group-form-modal";
import { GroupInviteModal } from "./group-invite-modal";

export interface GroupDetailModalsProps {
  editor: GroupEditorController;
  expenses: GroupExpenseEditorController;
  invite: GroupInviteMembersController;
  detail: GroupDetail | null;
  friends: readonly Friend[];
  isOwner: boolean;
  detailsVisible: boolean;
  memberActions: GroupMemberActionsController;
  joinCode: GroupJoinCodeController;
  onCloseDetails: () => void;
}

/** Group, invite, expense and details sheets of the group detail route. */
export function GroupDetailModals({
  editor,
  expenses,
  invite,
  detail,
  friends,
  isOwner,
  detailsVisible,
  memberActions,
  joinCode,
  onCloseDetails,
}: GroupDetailModalsProps) {
  return (
    <>
      <GroupFormModal
        visible={editor.formVisible}
        isEditing={editor.editingGroup !== null}
        initialValues={editor.initialValues}
        friends={friends}
        fieldErrors={editor.fieldErrors}
        error={editor.formError}
        submitting={editor.submitting}
        onSubmit={editor.submit}
        onClose={editor.closeForm}
      />

      <GroupExpenseFormModal editor={expenses} />

      <GroupInviteModal invite={invite} />

      <GroupDetailsModal
        visible={detailsVisible}
        detail={detail}
        isOwner={isOwner}
        memberActions={memberActions}
        joinCode={joinCode}
        onClose={onCloseDetails}
      />
    </>
  );
}

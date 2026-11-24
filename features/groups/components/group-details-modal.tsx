import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupMemberActionsController } from "../hooks/use-group-member-actions";
import type { GroupJoinCodeController } from "../hooks/use-group-join-code";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupDetail } from "../types/group.types";
import { GroupDetailsConfirmDialogs } from "./group-details-confirm-dialogs";
import { GroupDetailsEditButton } from "./group-details-edit-button";
import { GroupDetailsInfo } from "./group-details-info";
import { GroupDetailsLeaveButton } from "./group-details-leave-button";
import { GroupDetailsMembers } from "./group-details-members";
import { GroupJoinCodeCard } from "./group-join-code-card";
import { GroupPendingInvitationRow } from "./group-pending-invitation-row";

export interface GroupDetailsModalProps {
  visible: boolean;
  detail: GroupDetail | null;
  isOwner: boolean;
  memberActions: GroupMemberActionsController;
  joinCode: GroupJoinCodeController;
  onClose: () => void;
  /** Closes the sheet and opens the group edit form. */
  onEdit: () => void;
}

/** Page sheet with the group information, join code, members and invitations. */
export function GroupDetailsModal({
  visible,
  detail,
  isOwner,
  memberActions,
  joinCode,
  onClose,
  onEdit,
}: GroupDetailsModalProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const busy = memberActions.pendingId !== null;
  const members = detail?.members ?? [];
  const invitations = isOwner ? (detail?.invitations ?? []) : [];
  const leaving = memberActions.pendingAction === "leave";

  return (
    <PageSheetFormModal visible={visible} onRequestClose={onClose}>
      <SafeAreaView
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        <FormHeader
          title={t("details.title")}
          subtitle={t("details.subtitle")}
          closeAccessibilityLabel={t("details.closeAccessibility")}
          onClose={onClose}
        />

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {isOwner ? <GroupDetailsEditButton onPress={onEdit} /> : null}

          <GroupDetailsInfo
            group={detail?.group ?? null}
            memberCount={members.length}
          />

          <GroupJoinCodeCard
            code={joinCode.code}
            isOwner={isOwner}
            generating={joinCode.generating}
            error={joinCode.error}
            onGenerate={joinCode.generate}
            onShare={joinCode.share}
          />

          <GroupDetailsMembers
            members={members}
            isOwner={isOwner}
            busy={busy}
            memberActions={memberActions}
          />

          {memberActions.canLeave ? (
            <GroupDetailsLeaveButton
              groupName={detail?.group.name ?? ""}
              busy={busy}
              leaving={leaving}
              onPress={memberActions.requestLeave}
            />
          ) : (
            <ThemedText style={[styles.ownerLeaveHint, { color: theme.muted }]}>
              {t("details.ownerLeaveHint")}
            </ThemedText>
          )}

          {invitations.length > 0 ? (
            <View style={styles.section}>
              <ThemedText
                style={[styles.sectionTitle, { color: theme.muted }]}
              >
                {t("details.pendingTitle")}
              </ThemedText>
              {invitations.map((item) => (
                <GroupPendingInvitationRow
                  key={item.invitation.id}
                  item={item}
                  busy={busy}
                  canceling={
                    memberActions.pendingId === item.invitation.id &&
                    memberActions.pendingAction === "cancel-invitation"
                  }
                  onCancel={memberActions.requestCancelInvitation}
                />
              ))}
            </View>
          ) : null}

          <ErrorBanner message={memberActions.error} />
        </ScrollView>

        <GroupDetailsConfirmDialogs
          removeConfirm={memberActions.removeConfirm}
          cancelConfirm={memberActions.cancelConfirm}
          leaveConfirm={memberActions.leaveConfirm}
          transferConfirm={memberActions.transferConfirm}
          blockedDialog={memberActions.blockedDialog}
        />
      </SafeAreaView>
    </PageSheetFormModal>
  );
}

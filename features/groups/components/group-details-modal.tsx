import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import type { GroupMemberActionsController } from "../hooks/use-group-member-actions";
import { groupsStyles as styles } from "../styles/groups.styles";
import type { GroupDetail } from "../types/group.types";
import { GroupDetailsInfo } from "./group-details-info";
import { GroupMemberRow } from "./group-member-row";
import { GroupPendingInvitationRow } from "./group-pending-invitation-row";

export interface GroupDetailsModalProps {
  visible: boolean;
  detail: GroupDetail | null;
  isOwner: boolean;
  memberActions: GroupMemberActionsController;
  onClose: () => void;
}

/** Page sheet with the group information, members and pending invitations. */
export function GroupDetailsModal({
  visible,
  detail,
  isOwner,
  memberActions,
  onClose,
}: GroupDetailsModalProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");
  const busy = memberActions.pendingId !== null;
  const members = detail?.members ?? [];
  const invitations = isOwner ? (detail?.invitations ?? []) : [];
  const removeConfirm = memberActions.removeConfirm;
  const cancelConfirm = memberActions.cancelConfirm;

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
          <GroupDetailsInfo
            group={detail?.group ?? null}
            memberCount={members.length}
          />

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
              {t("details.membersLabel")}
            </ThemedText>
            {members.map((member) => (
              <GroupMemberRow
                key={member.uid}
                member={member}
                canRemove={isOwner && member.role !== "owner"}
                busy={busy}
                removing={memberActions.pendingId === member.uid}
                onRemove={memberActions.requestRemove}
              />
            ))}
          </View>

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
                  canceling={memberActions.pendingId === item.invitation.id}
                  onCancel={memberActions.requestCancelInvitation}
                />
              ))}
            </View>
          ) : null}

          <ErrorBanner message={memberActions.error} />
        </ScrollView>

        <ConfirmDialog
          visible={removeConfirm.visible}
          title={removeConfirm.title}
          message={removeConfirm.message}
          confirmLabel={removeConfirm.confirmLabel}
          cancelLabel={removeConfirm.cancelLabel}
          onConfirm={removeConfirm.confirm}
          onCancel={removeConfirm.close}
        />
        <ConfirmDialog
          visible={cancelConfirm.visible}
          title={cancelConfirm.title}
          message={cancelConfirm.message}
          confirmLabel={cancelConfirm.confirmLabel}
          cancelLabel={cancelConfirm.cancelLabel}
          onConfirm={cancelConfirm.confirm}
          onCancel={cancelConfirm.close}
        />
      </SafeAreaView>
    </PageSheetFormModal>
  );
}

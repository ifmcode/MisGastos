import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { FormActions } from "@/shared/components/molecules/form-actions";
import { FormHeader } from "@/shared/components/molecules/form-header";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { PageSheetFormModal } from "@/shared/components/molecules/page-sheet-form-modal";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import type { GroupInviteMembersController } from "../hooks/use-group-invite-members";
import { groupsStyles as styles } from "../styles/groups.styles";
import { GroupInviteeSelector } from "./group-invitee-selector";

export interface GroupInviteModalProps {
  invite: GroupInviteMembersController;
}

/** Owner page sheet of an extra invitation round of the group detail. */
export function GroupInviteModal({ invite }: GroupInviteModalProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common"]);
  const full = invite.capacity === 0;

  return (
    <PageSheetFormModal
      visible={invite.visible}
      onRequestClose={invite.close}
    >
      <SafeAreaView
        style={[styles.formContainer, { backgroundColor: theme.background }]}
      >
        <KeyboardAvoidingView
          style={styles.formContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ThemedView
            style={styles.formContainer}
            lightColor={theme.background}
            darkColor={theme.background}
          >
            <FormHeader
              title={t("invite.title")}
              subtitle={t("invite.subtitle")}
              closeAccessibilityLabel={t("invite.closeAccessibility")}
              disabled={invite.submitting}
              onClose={invite.close}
            />

            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {full ? (
                <EmptyState
                  title={t("invite.fullTitle")}
                  message={t("invite.full")}
                  variant="card"
                />
              ) : invite.friendsLoading ? (
                <LoadingState
                  variant="inline"
                  message={t("invite.friendsLoading")}
                />
              ) : invite.friendsError ? (
                <ErrorState
                  variant="inline"
                  message={invite.friendsError}
                  retryLabel={t("common:actions.retry")}
                  retryAccessibilityLabel={t("invite.retryFriendsAccessibility")}
                  onRetry={invite.retryFriends}
                />
              ) : invite.eligibleFriends.length === 0 ? (
                <EmptyState
                  title={t("invite.emptyTitle")}
                  message={t("invite.emptyMessage")}
                  variant="card"
                />
              ) : (
                <GroupInviteeSelector
                  friends={invite.eligibleFriends}
                  selectedIds={invite.selectedIds}
                  maxSelected={invite.capacity}
                  helper={t("invite.helper")}
                  disabled={invite.submitting}
                  onToggle={invite.toggle}
                />
              )}

              <ErrorBanner message={invite.error} />

              <FormActions
                submitting={invite.submitting}
                isEditing={false}
                canSubmit={!full && invite.selectedIds.length > 0}
                cancelLabel={t("invite.cancel")}
                cancelAccessibilityLabel={t("invite.cancelAccessibility")}
                submitLabel={t("invite.submit")}
                submitAccessibilityLabel={t("invite.submitAccessibility")}
                onCancel={invite.close}
                onSubmit={invite.submit}
              />
            </ScrollView>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PageSheetFormModal>
  );
}

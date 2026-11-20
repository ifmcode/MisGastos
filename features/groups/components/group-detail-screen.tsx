import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useGroupDetailScreen } from "../hooks/use-group-detail-screen";
import { groupsStyles as styles } from "../styles/groups.styles";
import { GroupDetailHeader } from "./group-detail-header";
import { GroupDetailMissingState } from "./group-detail-missing-state";
import { GroupDetailsModal } from "./group-details-modal";
import { GroupExpensesEmpty } from "./group-expenses-empty";
import { GroupFormModal } from "./group-form-modal";
import { GroupInviteModal } from "./group-invite-modal";
import { GroupRouteHeader } from "./group-route-header";

function readGroupId(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/** Group detail route: header, members sheet, invite and the expenses card. */
export function GroupDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common"]);
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const screen = useGroupDetailScreen({ groupId: readGroupId(params.groupId) });
  const { detail, editor, invite } = screen;
  // Loading and full errors have no group header yet, so they keep a back action.
  const showRouteHeader =
    screen.status === "loading" || screen.status === "error";

  const leave = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/social" as Href);
  }, [router]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {showRouteHeader ? (
        <GroupRouteHeader title={t("detail.title")} onBack={leave} />
      ) : null}

      {screen.status === "loading" ? (
        <LoadingState message={t("detail.loading")} />
      ) : screen.status === "error" ? (
        <ErrorState
          title={t("detail.errorTitle")}
          message={screen.error ?? ""}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("detail.retryAccessibility")}
          onRetry={screen.reload}
        />
      ) : screen.status === "missing" || !detail ? (
        <GroupDetailMissingState onBack={leave} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={screen.refreshing}
              onRefresh={screen.refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <ErrorBanner message={screen.error} />

          <GroupDetailHeader
            detail={detail}
            isOwner={screen.isOwner}
            onBack={leave}
            onOpenDetails={screen.openDetails}
            onEdit={() => editor.openEdit(detail.group)}
            onInvite={invite.open}
          />

          <GroupExpensesEmpty />
        </ScrollView>
      )}

      <GroupFormModal
        visible={editor.formVisible}
        isEditing={editor.editingGroup !== null}
        initialValues={editor.initialValues}
        friends={screen.friends}
        fieldErrors={editor.fieldErrors}
        error={editor.formError}
        submitting={editor.submitting}
        onSubmit={editor.submit}
        onClose={editor.closeForm}
      />

      <GroupInviteModal invite={invite} />

      <GroupDetailsModal
        visible={screen.detailsVisible}
        detail={detail}
        isOwner={screen.isOwner}
        memberActions={screen.memberActions}
        onClose={screen.closeDetails}
      />
    </ThemedView>
  );
}

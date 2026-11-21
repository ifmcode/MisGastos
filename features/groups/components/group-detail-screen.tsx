import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { GroupExpensesSection } from "@/features/group-expenses/components/group-expenses-section";
import type { GroupExpense } from "@/features/group-expenses/types/group-expense.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { Fab } from "@/shared/components/molecules/fab";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useGroupDetailScreen } from "../hooks/use-group-detail-screen";
import { groupsStyles as styles } from "../styles/groups.styles";
import { GroupDetailHeader } from "./group-detail-header";
import { GroupDetailMissingState } from "./group-detail-missing-state";
import { GroupDetailModals } from "./group-detail-modals";
import { GroupJoinRequestsSection } from "./group-join-requests-section";
import { GroupRouteHeader } from "./group-route-header";

function readGroupId(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/** Group detail route: header, member sheets, expenses and the create FAB. */
export function GroupDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const { t } = useTranslation(["groups", "common", "groupExpenses"]);
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const screen = useGroupDetailScreen({ groupId: readGroupId(params.groupId) });
  const { detail, editor, invite, expenses } = screen;
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

  // The row only navigates: edit and delete live in the expense detail.
  const openExpense = useCallback(
    (expense: GroupExpense) => {
      const groupId = encodeURIComponent(expense.groupId);
      router.push(
        `/social/group-expenses/${expense.id}?groupId=${groupId}` as Href,
      );
    },
    [router],
  );

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
            hasExpenses={
              expenses.loading || expenses.error !== null || expenses.hasExpenses
            }
            onBack={leave}
            onOpenDetails={screen.openDetails}
            onEdit={() => editor.openEdit(detail.group)}
            onInvite={invite.open}
          />

          {screen.isOwner ? (
            <GroupJoinRequestsSection {...screen.joinRequests} />
          ) : null}

          <GroupExpensesSection
            expenses={expenses.expenses}
            members={detail.members}
            viewerUid={screen.viewerUid}
            loading={expenses.loading}
            error={expenses.error}
            onRetry={expenses.retry}
            onOpenExpense={openExpense}
          />
        </ScrollView>
      )}

      {detail ? (
        <Fab
          accessibilityLabel={t("groupExpenses:fab.addAccessibility", {
            name: detail.group.name,
          })}
          accessibilityHint={t("groupExpenses:fab.addHint")}
          bottom={insets.bottom + 24}
          onPress={expenses.editor.openCreate}
        />
      ) : null}

      <GroupDetailModals
        editor={editor}
        expenses={expenses.editor}
        invite={invite}
        detail={detail}
        friends={screen.friends}
        isOwner={screen.isOwner}
        detailsVisible={screen.detailsVisible}
        memberActions={screen.memberActions}
        joinCode={screen.joinCode}
        onCloseDetails={screen.closeDetails}
      />
    </ThemedView>
  );
}

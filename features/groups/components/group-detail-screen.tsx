import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { Fab } from "@/shared/components/molecules/fab";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { useGroupDetailNavigation } from "../hooks/use-group-detail-navigation";
import { useGroupDetailScreen } from "../hooks/use-group-detail-screen";
import { groupsStyles as styles } from "../styles/groups.styles";
import { GroupDetailContent } from "./group-detail-content";
import { GroupDetailMissingState } from "./group-detail-missing-state";
import { GroupDetailModals } from "./group-detail-modals";
import { GroupRouteHeader } from "./group-route-header";

function readGroupId(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/** Group detail route: header, member sheets, balances, expenses and the FAB. */
export function GroupDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["groups", "common", "groupExpenses"]);
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const screen = useGroupDetailScreen({ groupId: readGroupId(params.groupId) });
  const { detail, editor, invite, expenses, balances, settlements } = screen;
  const navigation = useGroupDetailNavigation({
    groupId: detail?.group.id ?? "",
  });
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
        <GroupDetailContent
          detail={detail}
          viewerUid={screen.viewerUid}
          isOwner={screen.isOwner}
          refreshing={screen.refreshing}
          error={screen.error}
          balances={balances}
          settlements={settlements}
          expenses={expenses}
          onRefresh={screen.refresh}
          onBack={leave}
          onOpenDetails={screen.openDetails}
          onInvite={invite.open}
          onOpenExpense={navigation.openExpense}
          onOpenSettle={navigation.openSettle}
          onOpenSettlement={navigation.openSettlement}
        />
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
        onEditGroup={() => {
          screen.closeDetails();
          if (detail) editor.openEdit(detail.group);
        }}
      />
    </ThemedView>
  );
}

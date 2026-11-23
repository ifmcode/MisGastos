import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { ViewerGroupBalance } from "@/features/group-expenses/types/group-balance.types";
import { GroupsList } from "@/features/groups/components/groups-list";
import type { Group } from "@/features/groups/types/group.types";
import { ErrorBanner } from "@/shared/components/molecules/error-banner";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { socialStyles as styles } from "../styles/social.styles";

export interface SocialGroupsSegmentProps {
  groups: readonly Group[];
  /** Viewer nets by group id; empty while they load, which reads as settled. */
  balanceSummaries: Map<string, ViewerGroupBalance[]>;
  loading: boolean;
  error: string | null;
  viewerUid: string;
  /** False while friends load or when there are no accepted friends. */
  canCreate: boolean;
  onCreate: () => void;
  onOpen: (group: Group) => void;
  onEdit: (group: Group) => void;
  onRetry: () => void;
}

/**
 * "Tus grupos" segment. It owns its loading and error states so a friends
 * failure never hides the groups and vice versa; a failed load with cached
 * groups keeps the data and shows the banner instead of replacing it.
 */
export function SocialGroupsSegment({
  groups,
  balanceSummaries,
  loading,
  error,
  viewerUid,
  canCreate,
  onCreate,
  onOpen,
  onEdit,
  onRetry,
}: SocialGroupsSegmentProps) {
  const { t } = useTranslation(["groups", "common"]);

  if (loading) {
    return (
      <LoadingState variant="inline" message={t("list.loading")} />
    );
  }

  if (error && groups.length === 0) {
    return (
      <ErrorState
        variant="inline"
        message={error}
        retryLabel={t("common:actions.retry")}
        retryAccessibilityLabel={t("list.retryAccessibility")}
        onRetry={onRetry}
      />
    );
  }

  return (
    <View style={styles.groupsSegment}>
      <ErrorBanner message={error} />

      <GroupsList
        groups={groups}
        balanceSummaries={balanceSummaries}
        viewerUid={viewerUid}
        canCreate={canCreate}
        onCreate={onCreate}
        onOpen={onOpen}
        onEdit={onEdit}
      />
    </View>
  );
}

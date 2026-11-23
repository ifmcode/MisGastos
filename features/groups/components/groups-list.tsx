import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { ViewerGroupBalance } from "@/features/group-expenses/types/group-balance.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupsStyles as styles } from "../styles/groups.styles";
import type { Group } from "../types/group.types";
import { GroupRow } from "./group-row";

export interface GroupsListProps {
  groups: readonly Group[];
  /** Viewer nets by group id; a missing entry renders as settled. */
  balanceSummaries: Map<string, ViewerGroupBalance[]>;
  viewerUid: string;
  /** False while friends load or when there are no accepted friends. */
  canCreate: boolean;
  onCreate: () => void;
  onOpen: (group: Group) => void;
  onEdit: (group: Group) => void;
}

/** "Tus grupos" section with its empty state and create action. */
export function GroupsList({
  groups,
  balanceSummaries,
  viewerUid,
  canCreate,
  onCreate,
  onOpen,
  onEdit,
}: GroupsListProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.muted }]}>
        {t("list.sectionTitle")}
      </ThemedText>

      {groups.length === 0 ? (
        <EmptyState
          title={t("list.emptyTitle")}
          message={
            canCreate
              ? t("list.emptyMessage")
              : t("list.emptyNoFriendsMessage")
          }
          variant="card"
          primaryAction={
            canCreate
              ? {
                  label: t("list.emptyAction"),
                  accessibilityLabel: t("list.emptyActionAccessibility"),
                  icon: "people-outline",
                  onPress: onCreate,
                }
              : undefined
          }
        />
      ) : (
        groups.map((group) => (
          <GroupRow
            key={group.id}
            group={group}
            viewerUid={viewerUid}
            balances={balanceSummaries.get(group.id) ?? []}
            onOpen={onOpen}
            onEdit={onEdit}
          />
        ))
      )}
    </View>
  );
}

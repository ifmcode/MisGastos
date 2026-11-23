import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { SocialRouteHeader } from "@/features/social/components/social-route-header";
import type { GroupMember } from "@/features/groups/types/group.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupSettlementsStyles as styles } from "../styles/group-settlements.styles";
import type { GroupDebt } from "../types/group-balance.types";
import { GroupDebtRow } from "./group-debt-row";

export interface GroupSettlementDebtStepProps {
  /** Every debt of the group in the current toggle mode. */
  debts: readonly GroupDebt[];
  members: readonly GroupMember[];
  viewerUid: string;
  /** Group setting behind the direct/simplified caption. */
  simplifyDebts: boolean;
  onBack: () => void;
  /** Opens the form of the chosen pair on the same route. */
  onSelect: (debt: GroupDebt) => void;
}

/**
 * Debt picker shown before the settlement form when the route opens without a
 * pair. Every debt is listed; only the pairs of the viewer expose the settle
 * action, so the rest stay read-only.
 */
export function GroupSettlementDebtStep({
  debts,
  members,
  viewerUid,
  simplifyDebts,
  onBack,
  onSelect,
}: GroupSettlementDebtStepProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <>
      <SocialRouteHeader
        title={t("settleStep.title")}
        subtitle={t("settleStep.subtitle")}
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.stepCaption, { color: theme.muted }]}>
          {simplifyDebts ? t("settleStep.simplified") : t("settleStep.direct")}
        </ThemedText>

        {debts.length === 0 ? (
          <ThemedText style={[styles.stepEmpty, { color: theme.muted }]}>
            {t("settleStep.empty")}
          </ThemedText>
        ) : (
          <View
            accessibilityRole="list"
            accessibilityLabel={t("settleStep.listAccessibility")}
            style={styles.stepList}
          >
            {debts.map((debt) => (
              <GroupDebtRow
                key={`${debt.currency}-${debt.fromUserId}-${debt.toUserId}`}
                debt={debt}
                members={members}
                viewerUid={viewerUid}
                canSettle={
                  viewerUid === debt.fromUserId || viewerUid === debt.toUserId
                }
                onSettle={onSelect}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

import { useLocalSearchParams } from "expo-router";

import { GroupSettlementScreen } from "@/features/group-expenses/components/group-settlement-screen";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/**
 * Settlement route: `settlementId` opens the edit mode, while `currency`,
 * `from` and `to` carry the pair chosen in the group debt list.
 */
export default function GroupSettleRoute() {
  const params = useLocalSearchParams<{
    groupId?: string | string[];
    settlementId?: string | string[];
    currency?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>();

  return (
    <GroupSettlementScreen
      groupId={readParam(params.groupId)}
      settlementId={readParam(params.settlementId)}
      currency={readParam(params.currency).toUpperCase()}
      fromUserId={readParam(params.from)}
      toUserId={readParam(params.to)}
    />
  );
}

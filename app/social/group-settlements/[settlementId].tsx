import { useLocalSearchParams } from "expo-router";

import { GroupSettlementDetailScreen } from "@/features/group-expenses/components/group-settlement-detail-screen";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

/** Read-only group settlement targeted by a linked income in Movimientos. */
export default function GroupSettlementDetailRoute() {
  const params = useLocalSearchParams<{
    settlementId?: string | string[];
  }>();

  return (
    <GroupSettlementDetailScreen settlementId={readParam(params.settlementId)} />
  );
}

import { useLocalSearchParams } from "expo-router";

import { SettlementDetailScreen } from "@/features/settlements/components/settlement-detail-screen";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

export default function SettlementDetailRoute() {
  const params = useLocalSearchParams<{
    settlementId?: string | string[];
    from?: string | string[];
    friendUid?: string | string[];
  }>();

  return (
    <SettlementDetailScreen
      settlementId={readParam(params.settlementId)}
      from={readParam(params.from)}
      friendUid={readParam(params.friendUid)}
    />
  );
}

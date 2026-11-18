import { useLocalSearchParams } from "expo-router";

import { SettlementCreateScreen } from "@/features/settlements/components/settlement-create-screen";

function readFriendUid(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

export default function SettlementCreateRoute() {
  const params = useLocalSearchParams<{ friendUid?: string | string[] }>();

  return <SettlementCreateScreen friendUid={readFriendUid(params.friendUid)} />;
}

import { useLocalSearchParams } from "expo-router";

import { SettlementCreateScreen } from "@/features/settlements/components/settlement-create-screen";

function readParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;

  return (first ?? "").trim();
}

function readCurrency(value: string | string[] | undefined): string {
  return readParam(value).toUpperCase();
}

export default function SettlementCreateRoute() {
  const params = useLocalSearchParams<{
    friendUid?: string | string[];
    currency?: string | string[];
  }>();

  return (
    <SettlementCreateScreen
      friendUid={readParam(params.friendUid)}
      currency={readCurrency(params.currency)}
    />
  );
}

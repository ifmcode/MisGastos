import { useTranslation } from "react-i18next";

import { centsToAmount } from "@/features/friends/utils/friend-balance";
import type { Friend } from "@/features/friends/types/friend.types";
import type { Settlement } from "@/features/settlements/types/settlement.types";
import { getSharedExpenseParticipantName } from "@/features/shared-expenses/utils/shared-expense-friends";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { joinMetaParts } from "@/shared/utils/join-meta";

import type { FriendTimelineEntry } from "../utils/friend-timeline";
import { FriendTimelineRow } from "./friend-timeline-row";

export interface FriendTimelineSettlementRowProps {
  entry: Extract<FriendTimelineEntry, { kind: "settlement" }>;
  friends: readonly Friend[];
  viewerUid: string;
  onOpen: (settlement: Settlement) => void;
}

/**
 * Settlement row: the payment sentence as the title, the stored note as the
 * meta and no right-side amount because the sentence already carries it.
 */
export function FriendTimelineSettlementRow({
  entry,
  friends,
  viewerUid,
  onOpen,
}: FriendTimelineSettlementRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t } = useTranslation("settlements");
  const { t: tShared } = useTranslation("sharedExpenses");
  const { settlement } = entry;

  const friendUid =
    settlement.participantIds.find((uid) => uid !== viewerUid) ?? "";
  const friendName = getSharedExpenseParticipantName(
    friends,
    friendUid,
    tShared("friendFallback"),
  );
  const amount = locale.formatCurrency(
    centsToAmount(settlement.amountCents),
    settlement.currency,
  );
  const title =
    settlement.fromUserId === viewerUid
      ? t("message.youPaid", { amount, name: friendName })
      : t("message.youReceived", { amount, name: friendName });
  const note = settlement.note.trim();
  const date = locale.formatDate(settlement.date);
  const accessibilityLabel = joinMetaParts([date, title, note]);

  return (
    <FriendTimelineRow
      date={settlement.date}
      icon="cash-outline"
      iconColor={theme.success}
      iconBackground={theme.successSurface}
      title={title}
      meta={note.length > 0 ? note : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("message.openHint")}
      onPress={() => onOpen(settlement)}
    />
  );
}

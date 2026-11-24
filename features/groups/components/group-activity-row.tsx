import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { centsToAmount } from "@/features/friends/utils/friend-balance";
import { TimelineRow } from "@/shared/components/molecules/timeline-row";
import { useAppLocale } from "@/shared/hooks/use-app-locale";
import { useFormTheme, type FormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";
import { joinMetaParts } from "@/shared/utils/join-meta";

import type { GroupActivityType } from "../types/group-activity.types";
import {
  getGroupActivityMeta,
  getGroupActivityTitle,
} from "../utils/group-activity-copy";
import {
  getGroupActivityDate,
  getGroupActivityDestination,
  type GroupActivityDisplay,
} from "../utils/group-activity-display";

type IconName = ComponentProps<typeof Ionicons>["name"];
type RowTone = "primary" | "success" | "danger" | "warning" | "muted";

const TYPE_ICONS: Record<GroupActivityType, IconName> = {
  "expense-created": "receipt-outline",
  "expense-updated": "create-outline",
  "expense-deleted": "trash-outline",
  "settlement-created": "cash-outline",
  "settlement-updated": "sync-outline",
  "settlement-deleted": "close-circle-outline",
  "member-joined": "person-add-outline",
  "member-left": "exit-outline",
  "member-removed": "person-remove-outline",
  "owner-transferred": "key-outline",
  "group-updated": "settings-outline",
  "simplify-debts-changed": "swap-horizontal-outline",
};

const TYPE_TONES: Record<GroupActivityType, RowTone> = {
  "expense-created": "primary",
  "expense-updated": "primary",
  "expense-deleted": "danger",
  "settlement-created": "success",
  "settlement-updated": "success",
  "settlement-deleted": "danger",
  "member-joined": "success",
  "member-left": "muted",
  "member-removed": "danger",
  "owner-transferred": "warning",
  "group-updated": "primary",
  "simplify-debts-changed": "warning",
};

function getToneColors(theme: FormTheme, tone: RowTone) {
  if (tone === "success") {
    return { iconColor: theme.success, iconBackground: theme.successSurface };
  }
  if (tone === "danger") {
    return { iconColor: theme.danger, iconBackground: theme.dangerSurface };
  }
  if (tone === "warning") {
    return { iconColor: theme.warning, iconBackground: theme.warningSurface };
  }
  if (tone === "muted") {
    return { iconColor: theme.muted, iconBackground: theme.primarySoft };
  }

  return { iconColor: theme.primary, iconBackground: theme.primarySoft };
}

export interface GroupActivityRowProps {
  activity: GroupActivityDisplay;
  onOpenExpense: (expenseId: string) => void;
  onOpenSettlement: (settlementId: string) => void;
}

/**
 * One feed entry. Expenses and settlements open their detail; membership and
 * settings entries keep the same row style but are not pressable.
 */
export function GroupActivityRow({
  activity,
  onOpenExpense,
  onOpenSettlement,
}: GroupActivityRowProps) {
  const theme = useFormTheme();
  const locale = useAppLocale();
  const { t, tr } = useScopedTranslation("groups");
  const date = getGroupActivityDate(activity);
  const title = getGroupActivityTitle(activity, {
    tr,
    fallback: t("history.unknownMember"),
  });
  const meta = getGroupActivityMeta(activity, tr);
  const amount =
    activity.amountCents !== null && activity.currency
      ? locale.formatCurrency(
          centsToAmount(activity.amountCents),
          activity.currency,
        )
      : undefined;
  const destination = getGroupActivityDestination(activity);
  const onPress =
    destination?.kind === "expense"
      ? () => onOpenExpense(destination.expenseId)
      : destination?.kind === "settlement"
        ? () => onOpenSettlement(destination.settlementId)
        : undefined;
  const hint = destination
    ? tr(
        destination.kind === "expense"
          ? "history.row.openExpenseHint"
          : "history.row.openSettlementHint",
      )
    : undefined;
  const accessibilityLabel = joinMetaParts([
    locale.formatDate(date),
    title,
    meta,
    amount,
  ]);

  return (
    <TimelineRow
      date={date}
      icon={TYPE_ICONS[activity.type]}
      {...getToneColors(theme, TYPE_TONES[activity.type])}
      title={title}
      meta={meta}
      amount={amount}
      amountColor={
        activity.type.startsWith("settlement-")
          ? theme.success
          : theme.danger
      }
      accessibilityLabel={onPress ? accessibilityLabel : undefined}
      accessibilityHint={onPress ? hint : undefined}
      onPress={onPress}
    />
  );
}

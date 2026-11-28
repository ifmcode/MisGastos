import { IconBadgeButton } from "@/shared/components/molecules/icon-badge-button";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface NotificationsBellProps {
  /** Pending items of the inbox (notifications plus requests); hidden at zero. */
  count: number;
  onPress: () => void;
}

/** Dashboard bell with the inbox badge and its screen-reader summary. */
export function NotificationsBell({ count, onPress }: NotificationsBellProps) {
  const { t } = useScopedTranslation("notifications");

  return (
    <IconBadgeButton
      icon="notifications-outline"
      count={count}
      accessibilityLabel={
        count > 0 ? t("bell.label", { count }) : t("bell.label_zero")
      }
      accessibilityHint={t("bell.hint")}
      onPress={onPress}
    />
  );
}

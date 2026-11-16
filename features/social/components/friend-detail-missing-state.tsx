import { useTranslation } from "react-i18next";

import { EmptyState } from "@/shared/components/molecules/empty-state";

export interface FriendDetailMissingStateProps {
  /** Returns to the friends list, or to the Social tab on a cold deep link. */
  onBack: () => void;
}

/** Safe state when the uid no longer resolves to an accepted friend. */
export function FriendDetailMissingState({
  onBack,
}: FriendDetailMissingStateProps) {
  const { t } = useTranslation("social");

  return (
    <EmptyState
      icon="person-outline"
      title={t("friendDetail.notFoundTitle")}
      message={t("friendDetail.notFoundMessage")}
      primaryAction={{
        label: t("friendDetail.notFoundAction"),
        accessibilityLabel: t("friendDetail.notFoundActionAccessibility"),
        icon: "people-outline",
        onPress: onBack,
      }}
    />
  );
}

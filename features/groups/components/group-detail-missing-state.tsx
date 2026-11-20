import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

export interface GroupDetailMissingStateProps {
  /** Returns to the Social tab, or to the previous screen. */
  onBack: () => void;
}

/** Safe state when the group is missing, denied or no longer readable. */
export function GroupDetailMissingState({
  onBack,
}: GroupDetailMissingStateProps) {
  const { t } = useScopedTranslation("groups");

  return (
    <EmptyState
      icon="people-outline"
      title={t("detail.missingTitle")}
      message={t("detail.missingMessage")}
      primaryAction={{
        label: t("detail.missingAction"),
        accessibilityLabel: t("detail.missingActionAccessibility"),
        icon: "arrow-back-outline",
        onPress: onBack,
      }}
    />
  );
}

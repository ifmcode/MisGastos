import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

/** "Tus grupos" segment: groups arrive in Phase 6, so there is no action. */
export function SocialGroupsSegment() {
  const { t } = useScopedTranslation("social");

  return (
    <EmptyState
      title={t("groups.comingSoonTitle")}
      message={t("groups.comingSoonMessage")}
      variant="card"
    />
  );
}

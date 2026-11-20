import { EmptyState } from "@/shared/components/molecules/empty-state";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

/** Empty card of the group expenses section; TICKET-009 adds the list. */
export function GroupExpensesEmpty() {
  const { t } = useScopedTranslation("groups");

  return (
    <EmptyState
      title={t("detail.expensesEmptyTitle")}
      message={t("detail.expensesEmptyMessage")}
      variant="card"
    />
  );
}

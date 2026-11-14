import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Category } from "@/features/categories/types/category.types";
import { TransactionItem } from "@/features/transactions/components/transaction-item";
import { Transaction } from "@/features/transactions/types/transaction.types";
import { getTransactionCategory } from "@/features/transactions/utils/transaction-options";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { dashboardMovementsStyles as styles } from "../styles/dashboard-movements.styles";
import { DashboardSectionHeader } from "./dashboard-section-header";

export interface DashboardMovementsSectionProps {
  movements: readonly Transaction[];
  categories: readonly Category[];
  walletMap: ReadonlyMap<string, Wallet>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onRetry: () => void;
  onOpenMovements: () => void;
  onPressMovement: (transaction: Transaction) => void;
}

export function DashboardMovementsSection({
  movements,
  categories,
  walletMap,
  loading,
  error,
  hasMore,
  onRetry,
  onOpenMovements,
  onPressMovement,
}: DashboardMovementsSectionProps) {
  const { t } = useTranslation("dashboard");

  return (
    <View>
      <DashboardSectionHeader
        title={t("movements.title")}
        actionLabel={hasMore ? t("movements.viewAll") : undefined}
        actionAccessibilityLabel={
          hasMore ? t("movements.viewAllAccessibility") : undefined
        }
        onActionPress={hasMore ? onOpenMovements : undefined}
      />

      {loading ? (
        <LoadingState
          message={t("movements.loading")}
          variant="inline"
          size="small"
        />
      ) : error ? (
        <ErrorState
          message={error}
          retryLabel={t("movements.retry")}
          retryAccessibilityLabel={t("movements.retryAccessibility")}
          onRetry={onRetry}
          variant="inline"
        />
      ) : movements.length === 0 ? (
        <EmptyState
          title={t("movements.emptyTitle")}
          message={t("movements.emptyMessage")}
          variant="card"
        />
      ) : (
        <View style={styles.list}>
          {movements.map((movement) => (
            <TransactionItem
              key={movement.id}
              transaction={movement}
              wallet={walletMap.get(movement.walletId)}
              category={getTransactionCategory(
                categories,
                movement.categoryId,
              )}
              onPress={() => onPressMovement(movement)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

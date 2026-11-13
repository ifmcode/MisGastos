import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Category } from "@/features/categories/types/category.types";
import { TransactionItem } from "@/features/transactions/components/transaction-item";
import { Transaction } from "@/features/transactions/types/transaction.types";
import { getTransactionCategory } from "@/features/transactions/utils/transaction-options";
import { Wallet } from "@/features/wallets/types/wallet.types";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";
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
  const theme = useFormTheme();
  const { t } = useTranslation(["dashboard", "transactions"]);

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
        <View style={dashboardStyles.inlineLoading}>
          <ActivityIndicator size="small" color={dashboardPalette.primary} />
          <ThemedText style={dashboardStyles.inlineLoadingText}>
            {t("movements.loading")}
          </ThemedText>
        </View>
      ) : error ? (
        <View
          style={[
            dashboardStyles.inlineError,
            { backgroundColor: theme.dangerSurface },
          ]}
        >
          <ThemedText
            style={[dashboardStyles.inlineErrorText, { color: theme.dangerText }]}
          >
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("movements.retryAccessibility")}
            onPress={onRetry}
          >
            <ThemedText
              style={[dashboardStyles.inlineRetryText, { color: theme.danger }]}
            >
              {t("movements.retry")}
            </ThemedText>
          </Pressable>
        </View>
      ) : movements.length === 0 ? (
        <View style={styles.emptyCard}>
          <ThemedText type="defaultSemiBold">
            {t("movements.emptyTitle")}
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            {t("movements.emptyMessage")}
          </ThemedText>
        </View>
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
              accessibilityHint={t("movements.openHistoryHint")}
              onPress={() => onPressMovement(movement)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

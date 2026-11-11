import { RefreshControl, ScrollView } from "react-native";

import { dashboardPalette, dashboardStyles } from "../styles/dashboard.styles";
import {
  DashboardMovementsSection,
  type DashboardMovementsSectionProps,
} from "./dashboard-movements-section";
import {
  DashboardSummary,
  type DashboardSummaryProps,
} from "./dashboard-summary";
import {
  DashboardTransfersSection,
  type DashboardTransfersSectionProps,
} from "./dashboard-transfers-section";
import {
  DashboardWalletFilters,
  type DashboardWalletFiltersProps,
} from "./dashboard-wallet-filters";

export interface DashboardOverviewScrollProps {
  filters: DashboardWalletFiltersProps;
  summary: DashboardSummaryProps;
  movements: DashboardMovementsSectionProps;
  transfers: DashboardTransfersSectionProps;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardOverviewScroll({
  filters,
  summary,
  movements,
  transfers,
  refreshing,
  onRefresh,
}: DashboardOverviewScrollProps) {
  return (
    <ScrollView
      contentContainerStyle={dashboardStyles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={dashboardPalette.primary}
          colors={[dashboardPalette.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <DashboardWalletFilters {...filters} />
      <DashboardSummary {...summary} />
      <DashboardMovementsSection {...movements} />
      <DashboardTransfersSection {...transfers} />
    </ScrollView>
  );
}

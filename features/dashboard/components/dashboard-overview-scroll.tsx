import { ScrollView } from "react-native";

import { dashboardStyles } from "../styles/dashboard.styles";
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
}

export function DashboardOverviewScroll({
  filters,
  summary,
  movements,
  transfers,
}: DashboardOverviewScrollProps) {
  return (
    <ScrollView
      contentContainerStyle={dashboardStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <DashboardWalletFilters {...filters} />
      <DashboardSummary {...summary} />
      <DashboardMovementsSection {...movements} />
      <DashboardTransfersSection {...transfers} />
    </ScrollView>
  );
}

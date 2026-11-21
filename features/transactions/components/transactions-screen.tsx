import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useTransactionsScreen } from "../hooks/use-transactions-screen";
import { transactionsStyles as styles } from "../styles/transactions.styles";
import { TransactionsBody } from "./transactions-body";
import { TransactionsFab } from "./transactions-fab";
import { TransactionsHeader } from "./transactions-header";
import { TransactionsModals } from "./transactions-modals";

/** Movements tab: composes the header, list states, FAB and dialogs. */
export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const screen = useTransactionsScreen();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TransactionsHeader
        showActions={screen.showChrome}
        hasFilters={screen.hasFilters}
        onOpenFilters={screen.openFilters}
      />

      <TransactionsBody
        transactions={screen.filteredTransactions}
        walletMap={screen.walletMap}
        categories={screen.categories}
        hasFilters={screen.hasFilters}
        activeFilterCount={screen.activeFilterCount}
        refreshing={screen.refreshing}
        loading={screen.screenLoading}
        error={screen.screenError}
        onRetry={screen.retryLoad}
        onRefresh={screen.refreshAll}
        onOpenDetail={screen.openDetail}
        onCreate={screen.createMenu.openMenu}
        onClearFilters={screen.clearFilters}
      />

      {screen.showChrome ? (
        <TransactionsFab
          bottom={insets.bottom + 24}
          menuVisible={screen.createMenu.menuVisible}
          actions={screen.createMenu.actions}
          onOpen={screen.createMenu.openMenu}
          onClose={screen.createMenu.closeMenu}
        />
      ) : null}

      <TransactionsModals
        wallets={screen.wallets}
        activeWallets={screen.activeWallets}
        categories={screen.categories}
        preferredCurrency={screen.preferredCurrency}
        mutating={screen.mutating}
        mutationError={screen.mutationError}
        mutationFieldErrors={screen.mutationFieldErrors}
        detail={screen.detail}
        form={screen.dialog}
        filtersVisible={screen.filtersVisible}
        filters={screen.filters}
        onEditFromDetail={screen.editFromDetail}
        onDelete={screen.deleteTransaction}
        onApplyFilters={screen.applyFilters}
        onResetFilters={screen.clearFilters}
        onCloseFilters={screen.closeFilters}
        onCategoryCreated={screen.addCategory}
        sharedExpenseEditor={screen.createMenu.editor}
        groupExpenseEditor={screen.createMenu.groupExpenseEditor}
        friends={screen.createMenu.friends}
      />
    </ThemedView>
  );
}

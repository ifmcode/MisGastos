import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useTransferHistoryScreen } from "../hooks/use-transfer-history-screen";
import { transferHistoryStyles as styles } from "../styles/transfer-history.styles";
import { Transfer } from "../types/transfer.types";
import { TransferFormModal } from "./transfer-form-modal";
import { TransferHistoryEmptyState } from "./transfer-history-empty-state";
import { TransferHistoryErrorState } from "./transfer-history-error-state";
import { TransferHistoryHeader } from "./transfer-history-header";
import { TransferHistoryLoadingState } from "./transfer-history-loading-state";
import { TransferItem } from "./transfer-item";

function TransferHistorySeparator() {
  return <View style={styles.separator} />;
}

export function TransferHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    transfers,
    wallets,
    activeWallets,
    walletMap,
    loading,
    refreshing,
    error,
    mutating,
    createError,
    createFieldErrors,
    form,
    reload,
    refresh,
  } = useTransferHistoryScreen();

  function renderTransfer({ item }: { item: Transfer }) {
    return (
      <TransferItem
        transfer={item}
        fromWallet={walletMap.get(item.fromWalletId)}
        toWallet={walletMap.get(item.toWalletId)}
        onPress={() => form.openEdit(item)}
      />
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TransferHistoryHeader onBack={() => router.back()} />

      {loading ? (
        <TransferHistoryLoadingState />
      ) : error ? (
        <TransferHistoryErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={transfers}
          keyExtractor={(transfer) => transfer.id}
          renderItem={renderTransfer}
          ItemSeparatorComponent={TransferHistorySeparator}
          ListEmptyComponent={<TransferHistoryEmptyState />}
          contentContainerStyle={[
            styles.listContent,
            transfers.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={refresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TransferFormModal
        visible={form.visible}
        wallets={activeWallets}
        walletLookup={wallets}
        editingTransfer={form.editingTransfer}
        submitting={mutating}
        error={createError}
        fieldErrors={createFieldErrors}
        onSubmit={(input) => void form.submit(input)}
        onDelete={form.deleteEditing}
        onClose={form.close}
      />
    </ThemedView>
  );
}

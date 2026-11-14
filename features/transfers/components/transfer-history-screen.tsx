import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { EmptyState } from "@/shared/components/molecules/empty-state";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { LoadingState } from "@/shared/components/molecules/loading-state";
import { asTranslate } from "@/shared/i18n/translate";

import { useTransferHistoryScreen } from "../hooks/use-transfer-history-screen";
import { transferHistoryStyles as styles } from "../styles/transfer-history.styles";
import { Transfer } from "../types/transfer.types";
import { getTransferHistoryEmptyCopy } from "../utils/transfer-history";
import { TransferDetailModal } from "./transfer-detail-modal";
import { TransferFormModal } from "./transfer-form-modal";
import { TransferHistoryHeader } from "./transfer-history-header";
import { TransferItem } from "./transfer-item";

function TransferHistorySeparator() {
  return <View style={styles.separator} />;
}

export function TransferHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["transfers", "common"]);
  const tr = asTranslate(t);
  const emptyCopy = getTransferHistoryEmptyCopy();
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
    detail,
    form,
    openDetail,
    editFromDetail,
    deleteTransfer,
    reload,
    refresh,
  } = useTransferHistoryScreen();

  function renderTransfer({ item }: { item: Transfer }) {
    return (
      <TransferItem
        transfer={item}
        fromWallet={walletMap.get(item.fromWalletId)}
        toWallet={walletMap.get(item.toWalletId)}
        labelKind="detail"
        onPress={() => openDetail(item)}
      />
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <TransferHistoryHeader onBack={() => router.back()} />

      {loading ? (
        <LoadingState message={t("loading")} />
      ) : error ? (
        <ErrorState
          title={t("errorTitle")}
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={reload}
        />
      ) : (
        <FlatList
          data={transfers}
          keyExtractor={(transfer) => transfer.id}
          renderItem={renderTransfer}
          ItemSeparatorComponent={TransferHistorySeparator}
          ListEmptyComponent={
            <EmptyState
              icon="swap-horizontal"
              title={tr(emptyCopy.titleKey)}
              message={tr(emptyCopy.messageKey)}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            transfers.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={refresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TransferDetailModal
        visible={detail.visible}
        transfer={detail.transfer}
        wallets={wallets}
        mutating={mutating}
        error={createError}
        onEdit={editFromDetail}
        onDelete={deleteTransfer}
        onClose={detail.close}
      />

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

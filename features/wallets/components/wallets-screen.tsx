import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useWallets } from "../hooks/use-wallets";
import { WalletInput } from "../schemas/wallet.schema";
import { walletsPalette, walletsStyles } from "../styles/wallets.styles";
import { Wallet } from "../types/wallet.types";
import { WalletCard } from "./wallet-card";
import { WalletSummary } from "./wallet-summary";
import { WalletsEmptyState } from "./wallets-empty-state";
import { WalletsErrorState } from "./wallets-error-state";
import { WalletsFormModal } from "./wallets-form-modal";
import { WalletsHeader } from "./wallets-header";
import { WalletsLoadingState } from "./wallets-loading-state";

function WalletSeparator() {
  return <View style={walletsStyles.separator} />;
}

export function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const {
    wallets,
    totals,
    loading,
    refreshing,
    creating,
    error,
    createError,
    createFieldErrors,
    reload,
    refresh,
    createWallet,
    clearCreateState,
  } = useWallets();

  const [isFormVisible, setIsFormVisible] = useState(false);

  const canAddWallet = !loading && !error && wallets.length > 0;

  function openForm() {
    clearCreateState();
    setIsFormVisible(true);
  }

  function closeForm() {
    if (creating) return;
    setIsFormVisible(false);
  }

  async function handleCreate(input: WalletInput) {
    const created = await createWallet(input);
    if (created) setIsFormVisible(false);
  }

  function renderWallet({ item }: { item: Wallet }) {
    return <WalletCard wallet={item} />;
  }

  return (
    <ThemedView
      style={[walletsStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <WalletsHeader
        showAddButton={canAddWallet}
        onAddPress={openForm}
      />

      {loading ? (
        <WalletsLoadingState />
      ) : error ? (
        <WalletsErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(wallet) => wallet.id}
          renderItem={renderWallet}
          ItemSeparatorComponent={WalletSeparator}
          ListHeaderComponent={
            totals.length > 0 ? <WalletSummary totals={totals} /> : null
          }
          ListEmptyComponent={<WalletsEmptyState onCreate={openForm} />}
          contentContainerStyle={[
            walletsStyles.listContent,
            wallets.length === 0 && walletsStyles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {canAddWallet ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir cartera"
          onPress={openForm}
          style={[walletsStyles.fab, { bottom: insets.bottom + 24 }]}
        >
          <Ionicons name="add" size={30} color={walletsPalette.onPrimary} />
        </Pressable>
      ) : null}

      <WalletsFormModal
        visible={isFormVisible}
        submitting={creating}
        error={createError}
        fieldErrors={createFieldErrors}
        onSubmit={(input) => void handleCreate(input)}
        onClose={closeForm}
      />
    </ThemedView>
  );
}

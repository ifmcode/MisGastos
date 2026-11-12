import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ConfirmDialog } from "@/shared/components/molecules/confirm-dialog";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useWalletScreen } from "../hooks/use-wallet-screen";
import { walletManagementStyles as managementStyles } from "../styles/wallet-management.styles";
import { walletsPalette, walletsStyles } from "../styles/wallets.styles";
import { buildWalletFormValues } from "../utils/wallet-options";
import { WalletActionsModal } from "./wallet-actions-modal";
import { WalletDeleteModal } from "./wallet-delete-modal";
import { WalletsFormModal } from "./wallets-form-modal";
import { WalletsHeader } from "./wallets-header";
import { WalletsList } from "./wallets-list";
import { WalletsTransferActions } from "./wallets-transfer-actions";

export function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useFormTheme();
  const screen = useWalletScreen();
  const { wallets, management, archiveDialog } = screen;

  return (
    <ThemedView
      style={[walletsStyles.container, { paddingTop: insets.top + 16 }]}
    >
      <WalletsHeader
        showAddButton={screen.canAddWallet}
        onAddPress={screen.openCreate}
      />

      {!wallets.loading && !wallets.error ? (
        <WalletsTransferActions
          activeWallets={wallets.activeWallets}
          walletLookup={wallets.wallets}
          onWalletsChanged={() => void wallets.refresh()}
          onHistoryPress={() => router.push("/transfers" as Href)}
        />
      ) : null}

      {screen.showScreenError ? (
        <View
          style={[
            managementStyles.errorBanner,
            {
              backgroundColor: theme.dangerSurface,
              marginHorizontal: 24,
              marginBottom: 12,
            },
          ]}
        >
          <ThemedText
            style={[managementStyles.errorText, { color: theme.dangerText }]}
          >
            {wallets.mutationError}
          </ThemedText>
        </View>
      ) : null}

      <WalletsList
        wallets={wallets.wallets}
        activeWallets={wallets.activeWallets}
        archivedWallets={wallets.archivedWallets}
        totals={wallets.totals}
        loading={wallets.loading}
        refreshing={wallets.refreshing}
        error={wallets.error}
        onReload={() => void wallets.reload()}
        onRefresh={() => void wallets.refresh()}
        onCreate={screen.openCreate}
        onWalletPress={screen.openActions}
      />

      {screen.canAddWallet ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir cartera"
          onPress={screen.openCreate}
          style={[walletsStyles.fab, { bottom: insets.bottom + 24 }]}
        >
          <Ionicons name="add" size={30} color={walletsPalette.onPrimary} />
        </Pressable>
      ) : null}

      <WalletActionsModal
        wallet={management.actionsWallet}
        onEdit={() => {
          if (management.actionsWallet) screen.openEdit(management.actionsWallet);
        }}
        onToggleArchive={screen.requestArchiveToggle}
        onDelete={() => {
          if (management.actionsWallet) screen.openDelete(management.actionsWallet);
        }}
        onClose={management.closeActions}
      />

      <WalletsFormModal
        visible={management.formMode !== null}
        mode={management.formMode ?? "create"}
        initialValues={
          management.editingWallet
            ? buildWalletFormValues(management.editingWallet)
            : undefined
        }
        initialBalanceLocked={
          management.usageLoading ||
          Boolean(management.editingUsage?.hasMovements)
        }
        submitting={wallets.mutating}
        error={wallets.mutationError}
        fieldErrors={wallets.mutationFieldErrors}
        onSubmit={(input) => void screen.submitForm(input)}
        onClose={screen.closeForm}
      />

      <WalletDeleteModal
        wallet={management.deleteTarget}
        usage={management.deleteUsage}
        wallets={wallets.activeWallets}
        submitting={wallets.mutating}
        error={wallets.mutationError}
        onConfirm={(options) => void screen.confirmDelete(options)}
        onClose={screen.closeDelete}
      />

      <ConfirmDialog
        visible={archiveDialog.visible}
        title={archiveDialog.title}
        message={archiveDialog.message}
        confirmLabel={archiveDialog.confirmLabel}
        cancelLabel={archiveDialog.cancelLabel}
        tone="primary"
        onConfirm={archiveDialog.confirm}
        onCancel={archiveDialog.close}
      />
    </ThemedView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useWallets } from "../hooks/use-wallets";
import { WalletInput } from "../schemas/wallet.schema";
import { Wallet } from "../types/wallet.types";
import { WalletCard } from "./wallet-card";
import { WalletForm } from "./wallet-form";
import { WalletSummary } from "./wallet-summary";

function WalletSeparator() {
  return <View style={styles.separator} />;
}

function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0A7EA4" />
      <ThemedText style={styles.centeredText}>
        Cargando carteras…
      </ThemedText>
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.centered}>
      <Ionicons name="cloud-offline-outline" size={42} color="#C62828" />
      <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
        No se pudieron cargar las carteras
      </ThemedText>
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de carteras"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}

interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="wallet-outline" size={36} color="#0A7EA4" />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        Aún no tienes carteras
      </ThemedText>
      <ThemedText style={styles.centeredText}>
        Crea tu primera cartera para empezar a organizar tus gastos e
        ingresos.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear primera cartera"
        onPress={onCreate}
        style={styles.createButton}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <ThemedText style={styles.createButtonText}>Crear cartera</ThemedText>
      </Pressable>
    </View>
  );
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

  function openForm() {
    clearCreateState();
    setIsFormVisible(true);
  }

  function closeForm() {
    if (!creating) {
      setIsFormVisible(false);
    }
  }

  async function handleCreate(input: WalletInput) {
    const created = await createWallet(input);

    if (created) {
      setIsFormVisible(false);
    }
  }

  const renderWallet = ({ item }: { item: Wallet }) => (
    <WalletCard wallet={item} />
  );

  return (
    <ThemedView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.title}>
            Carteras
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Consulta y organiza tus cuentas.
          </ThemedText>
        </View>

        {!loading && !error && wallets.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Añadir cartera"
            onPress={openForm}
            style={styles.headerButton}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <ThemedText style={styles.headerButtonText}>Nueva</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(wallet) => wallet.id}
          renderItem={renderWallet}
          ItemSeparatorComponent={WalletSeparator}
          ListHeaderComponent={
            totals.length > 0 ? <WalletSummary totals={totals} /> : null
          }
          ListEmptyComponent={<EmptyState onCreate={openForm} />}
          contentContainerStyle={[
            styles.listContent,
            wallets.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!loading && !error && wallets.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir cartera"
          onPress={openForm}
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Modal
        visible={isFormVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}
      >
        {isFormVisible ? (
          <WalletForm
            submitting={creating}
            error={createError}
            fieldErrors={createFieldErrors}
            onSubmit={(input) => void handleCreate(input)}
            onCancel={closeForm}
          />
        ) : null}
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
    marginTop: 2,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0A7EA4",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  separator: {
    height: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  centeredText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  errorTitle: {
    marginTop: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: "#0A7EA4",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: "rgba(10, 126, 164, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A7EA4",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#0A7EA4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useWallets } from "@/features/wallets/hooks/use-wallets";
import { formatMoney } from "@/features/wallets/utils/money";

import { TransactionForm } from "./transaction-form";
import { TransactionFiltersModal } from "./transaction-filters-modal";
import { TransactionItem } from "./transaction-item";
import { useTransactions } from "../hooks/use-transactions";
import { TransactionInput } from "../schemas/transaction.schema";
import { Transaction } from "../types/transaction.types";
import {
  DEFAULT_TRANSACTION_FILTERS,
  TransactionFilters,
} from "../utils/transaction-filters";
import { getCategoriesForType, getTransactionCategory } from "../utils/transaction-options";

function TransactionSeparator() {
  return <View style={styles.separator} />;
}

function LoadingState() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0A7EA4" />
      <ThemedText style={styles.centeredText}>Cargando movimientos…</ThemedText>
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
        No se pudieron cargar los movimientos
      </ThemedText>
      <ThemedText style={styles.centeredText}>{message}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga de movimientos"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}

function EmptyState({ hasFilters, onCreate, onClearFilters }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={36} color="#0A7EA4" />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {hasFilters ? "Sin resultados" : "Aún no tienes movimientos"}
      </ThemedText>
      <ThemedText style={styles.centeredText}>
        {hasFilters
          ? "No hay movimientos con los filtros aplicados. Prueba a cambiarlos."
          : "Registra tu primer gasto o ingreso para empezar a seguir tu saldo."}
      </ThemedText>
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar filtros"
          onPress={onClearFilters}
          style={styles.secondaryEmptyButton}
        >
          <ThemedText style={styles.secondaryEmptyButtonText}>
            Limpiar filtros
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear primer movimiento"
          onPress={onCreate}
          style={styles.createButton}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <ThemedText style={styles.createButtonText}>Crear movimiento</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

export function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { wallets } = useWallets();
  const {
    filteredTransactions,
    filters,
    activeFilterCount,
    loading,
    refreshing,
    mutating,
    error,
    mutationError,
    mutationFieldErrors,
    reload,
    refresh,
    setFilters,
    resetFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearMutationState,
  } = useTransactions();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  );

  function openCreate() {
    clearMutationState();
    setEditingTransaction(null);
    setIsFormVisible(true);
  }

  function openEdit(transaction: Transaction) {
    clearMutationState();
    setEditingTransaction(transaction);
    setIsFormVisible(true);
  }

  function closeForm() {
    if (!mutating) {
      setIsFormVisible(false);
      setEditingTransaction(null);
    }
  }

  async function handleSubmit(input: TransactionInput) {
    if (editingTransaction) {
      const updated = await updateTransaction(editingTransaction.id, input);
      if (updated) {
        setIsFormVisible(false);
        setEditingTransaction(null);
      }
      return;
    }

    const created = await createTransaction(input);
    if (created) {
      setIsFormVisible(false);
    }
  }

  function handleDelete(transaction: Transaction) {
    const wallet = walletMap.get(transaction.walletId);
    const walletName = wallet?.name ?? "esta cartera";
    const category = getTransactionCategory(transaction.categoryId);
    const amount = formatMoney(transaction.amount, transaction.currency);

    Alert.alert(
      "Eliminar movimiento",
      `Se eliminará "${transaction.concept}" (${amount}) de ${walletName} y se revertirá el saldo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const deleted = await deleteTransaction(transaction.id);
            if (!deleted) return;
            if (editingTransaction?.id === transaction.id) {
              setIsFormVisible(false);
              setEditingTransaction(null);
            }
          },
        },
      ],
    );
  }

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      wallet={walletMap.get(item.walletId)}
      category={getTransactionCategory(item.categoryId)}
      onPress={() => openEdit(item)}
    />
  );

  const hasFilters = activeFilterCount > 0;
  const defaultWalletId = wallets[0]?.id ?? "";
  const defaultCurrency = wallets[0]?.currency ?? "EUR";
  const defaultCategoryId =
    wallets.length > 0
      ? getCategoriesForType("expense")[0]?.id ?? "food"
      : getCategoriesForType("expense")[0]?.id ?? "food";

  return (
    <ThemedView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.title}>
            Movimientos
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Gastos, ingresos e historial.
          </ThemedText>
        </View>

        {!loading && !error ? (
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros"
              onPress={() => setIsFiltersVisible(true)}
              style={styles.headerIconButton}
            >
              <Ionicons name="options-outline" size={20} color="#0A7EA4" />
              {hasFilters ? <View style={styles.filterDot} /> : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Añadir movimiento"
              onPress={openCreate}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.headerButtonText}>Nuevo</ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(transaction) => transaction.id}
          renderItem={renderItem}
          ItemSeparatorComponent={TransactionSeparator}
          ListHeaderComponent={
            hasFilters ? (
              <View style={styles.activeFiltersRow}>
                <ThemedText style={styles.activeFiltersText}>
                  {filteredTransactions.length} resultados · {activeFilterCount} filtro{activeFilterCount === 1 ? "" : "s"}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar filtros"
                  onPress={resetFilters}
                >
                  <ThemedText style={styles.clearFiltersText}>
                    Limpiar
                  </ThemedText>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              hasFilters={hasFilters}
              onCreate={openCreate}
              onClearFilters={resetFilters}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredTransactions.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!loading && !error ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir movimiento"
          onPress={openCreate}
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
          <TransactionForm
            submitting={mutating}
            error={mutationError}
            fieldErrors={mutationFieldErrors}
            wallets={wallets}
            initialValues={
              editingTransaction
                ? {
                    type: editingTransaction.type,
                    amount: String(editingTransaction.amount),
                    walletId: editingTransaction.walletId,
                    currency: editingTransaction.currency,
                    categoryId: editingTransaction.categoryId,
                    concept: editingTransaction.concept,
                    notes: editingTransaction.notes ?? "",
                    date: editingTransaction.date,
                  }
                : {
                    type: "expense",
                    amount: "",
                    walletId: defaultWalletId,
                    currency: defaultCurrency,
                    categoryId: defaultCategoryId,
                    concept: "",
                    notes: "",
                    date: "",
                  }
            }
            isEditing={Boolean(editingTransaction)}
            onSubmit={(input) => void handleSubmit(input)}
            onDelete={
              editingTransaction
                ? () => handleDelete(editingTransaction)
                : undefined
            }
            onCancel={closeForm}
          />
        ) : null}
      </Modal>

      <Modal
        visible={isFiltersVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFiltersVisible(false)}
      >
        {isFiltersVisible ? (
          <TransactionFiltersModal
            wallets={wallets}
            filters={filters}
            onApply={(next: TransactionFilters) => {
              setFilters(next);
              setIsFiltersVisible(false);
            }}
            onReset={() => {
              resetFilters();
              setIsFiltersVisible(false);
            }}
            onCancel={() => setIsFiltersVisible(false)}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 126, 164, 0.12)",
  },
  filterDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0A7EA4",
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
  secondaryEmptyButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 126, 164, 0.4)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  secondaryEmptyButtonText: {
    color: "#0A7EA4",
    fontSize: 15,
    fontWeight: "700",
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activeFiltersText: {
    fontSize: 13,
    opacity: 0.7,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0A7EA4",
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

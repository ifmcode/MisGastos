import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Wallet } from "@/features/wallets/types/wallet.types";

import { parseDateInput } from "../utils/transaction-date";
import { TransactionFilters, TransactionSortOrder } from "../utils/transaction-filters";
import { getCategoriesForType, TRANSACTION_TYPE_OPTIONS } from "../utils/transaction-options";

export interface TransactionFiltersModalProps {
  wallets: Wallet[];
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onReset: () => void;
  onCancel: () => void;
}

export function TransactionFiltersModal({
  wallets,
  filters,
  onApply,
  onReset,
  onCancel,
}: TransactionFiltersModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const background = isDark ? "#151718" : "#F7FAFB";
  const surface = isDark ? "#1C2225" : "#FFFFFF";
  const border = isDark ? "#2B3438" : "#DCE6E9";
  const textColor = isDark ? "#ECEDEE" : "#11181C";
  const mutedColor = isDark ? "#9BA1A6" : "#5C6B70";

  const [localFilters, setLocalFilters] =
    useState<TransactionFilters>(filters);
  const [fromText, setFromText] = useState(filters.fromDate);
  const [toText, setToText] = useState(filters.toDate);

  function updateFilters(patch: Partial<TransactionFilters>) {
    setLocalFilters((current) => ({ ...current, ...patch }));
  }

  function setFromDate(text: string) {
    setFromText(text);
    updateFilters({ fromDate: text });
  }

  function setToDate(text: string) {
    setToText(text);
    updateFilters({ toDate: text });
  }

  function apply() {
    const next: TransactionFilters = {
      ...localFilters,
      fromDate: parseDateInput(localFilters.fromDate) ? localFilters.fromDate : "",
      toDate: parseDateInput(localFilters.toDate) ? localFilters.toDate : "",
    };
    onApply(next);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={background}
          darkColor={background}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>
                Filtros
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
                Filtra y ordena tu historial.
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar filtros"
              hitSlop={10}
              onPress={onCancel}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={mutedColor} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={styles.label}>Orden</ThemedText>
            <View style={styles.typeRow}>
              {([
                { value: "desc", label: "Más recientes primero" },
                { value: "asc", label: "Más antiguos primero" },
              ] as Array<{ value: TransactionSortOrder; label: string }>).map(
                (option) => {
                  const selected = localFilters.sort === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option.label}
                      onPress={() => updateFilters({ sort: option.value })}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: selected ? "#0A7EA4" : surface,
                          borderColor: selected ? "#0A7EA4" : border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.typeButtonText,
                          { color: selected ? "#FFFFFF" : textColor },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                },
              )}
            </View>

            <ThemedText style={styles.label}>Tipo</ThemedText>
            <View style={styles.typeRow}>
              {[
                { value: "all" as const, label: "Todos" },
                ...TRANSACTION_TYPE_OPTIONS,
              ].map((option) => {
                const selected = localFilters.type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => updateFilters({ type: option.value })}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: selected ? "#0A7EA4" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.typeButtonText,
                        { color: selected ? "#FFFFFF" : textColor },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={styles.label}>Cartera</ThemedText>
            <View style={styles.chipsWrap}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: localFilters.walletId === "" }}
                accessibilityLabel="Todas las carteras"
                onPress={() => updateFilters({ walletId: "" })}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      localFilters.walletId === "" ? "#0A7EA4" : surface,
                    borderColor:
                      localFilters.walletId === "" ? "#0A7EA4" : border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: localFilters.walletId === "" ? "#FFFFFF" : textColor },
                  ]}
                >
                  Todas
                </ThemedText>
              </Pressable>
              {wallets.map((wallet) => {
                const selected = localFilters.walletId === wallet.id;
                return (
                  <Pressable
                    key={wallet.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={wallet.name}
                    onPress={() => updateFilters({ walletId: wallet.id })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? "#0A7EA4" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        { color: selected ? "#FFFFFF" : textColor },
                      ]}
                    >
                      {wallet.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={styles.label}>Categoría</ThemedText>
            <View style={styles.chipsWrap}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: localFilters.categoryId === "" }}
                accessibilityLabel="Todas las categorías"
                onPress={() => updateFilters({ categoryId: "" })}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      localFilters.categoryId === "" ? "#0A7EA4" : surface,
                    borderColor:
                      localFilters.categoryId === "" ? "#0A7EA4" : border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: localFilters.categoryId === "" ? "#FFFFFF" : textColor },
                  ]}
                >
                  Todas
                </ThemedText>
              </Pressable>
              {getCategoriesForType(
                localFilters.type === "all" ? "expense" : localFilters.type,
              ).map((category) => {
                const selected = localFilters.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={category.label}
                    onPress={() => updateFilters({ categoryId: category.id })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? "#0A7EA4" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chipText,
                        { color: selected ? "#FFFFFF" : textColor },
                      ]}
                    >
                      {category.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText style={styles.label}>Rango de fechas</ThemedText>
            <View style={styles.dateRow}>
              <TextInput
                value={fromText}
                onChangeText={setFromDate}
                placeholder="Desde DD/MM/AAAA"
                placeholderTextColor={mutedColor}
                style={[
                  styles.dateInput,
                  { backgroundColor: surface, borderColor: border, color: textColor },
                ]}
              />
              <TextInput
                value={toText}
                onChangeText={setToDate}
                placeholder="Hasta DD/MM/AAAA"
                placeholderTextColor={mutedColor}
                style={[
                  styles.dateInput,
                  { backgroundColor: surface, borderColor: border, color: textColor },
                ]}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restablecer filtros"
                onPress={onReset}
                style={[
                  styles.secondaryButton,
                  { borderColor: border, backgroundColor: surface },
                ]}
              >
                <ThemedText type="defaultSemiBold">Restablecer</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aplicar filtros"
                onPress={apply}
                style={styles.primaryButton}
              >
                <ThemedText style={styles.primaryButtonText}>Aplicar</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#0A7EA4",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

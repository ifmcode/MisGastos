import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { getCurrencySymbol } from "@/features/wallets/utils/money";

import { TransactionFormValues } from "../types/transaction.types";
import {
  toTransactionFieldErrors,
  validateTransactionInput,
  TransactionInput,
  TransactionValidationErrors,
  TRANSACTION_CONCEPT_MAX_LENGTH,
  TRANSACTION_NOTES_MAX_LENGTH,
} from "../schemas/transaction.schema";
import { formatDateInput, getTodayIsoDate, parseDateInput } from "../utils/transaction-date";
import {
  getCategoriesForType,
  getDefaultCategoryId,
  getTransactionCategory,
  TRANSACTION_TYPE_OPTIONS,
} from "../utils/transaction-options";

export interface TransactionFormProps {
  submitting: boolean;
  error?: string | null;
  fieldErrors?: TransactionValidationErrors;
  wallets: Wallet[];
  initialValues: TransactionFormValues;
  isEditing: boolean;
  onSubmit: (input: TransactionInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

function getInitialFormValues(
  initialValues: TransactionFormValues,
): TransactionFormValues {
  return {
    ...initialValues,
    amount: initialValues.amount,
    date: initialValues.date || getTodayIsoDate(),
  };
}

export function TransactionForm({
  submitting,
  error,
  fieldErrors = {},
  wallets,
  initialValues,
  isEditing,
  onSubmit,
  onCancel,
  onDelete,
}: TransactionFormProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const background = isDark ? "#151718" : "#F7FAFB";
  const surface = isDark ? "#1C2225" : "#FFFFFF";
  const border = isDark ? "#2B3438" : "#DCE6E9";
  const textColor = isDark ? "#ECEDEE" : "#11181C";
  const mutedColor = isDark ? "#9BA1A6" : "#5C6B70";
  const errorColor = "#C62828";

  const [values, setValues] = useState<TransactionFormValues>(() =>
    getInitialFormValues(initialValues),
  );
  const [localErrors, setLocalErrors] = useState<TransactionValidationErrors>({});
  const [dateText, setDateText] = useState(() =>
    values.date ? formatDateInput(values.date) : "",
  );

  const errors: TransactionValidationErrors = { ...localErrors, ...fieldErrors };

  const categories = useMemo(
    () => getCategoriesForType(values.type),
    [values.type],
  );

  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === values.walletId),
    [wallets, values.walletId],
  );

  function updateValue<K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (key === "walletId") {
        const wallet = wallets.find((item) => item.id === value);
        if (wallet && next.currency !== wallet.currency) {
          next.currency = wallet.currency;
        }
      }

      if (key === "type") {
        const typeValue = value as TransactionFormValues["type"];
        const currentCategory = getTransactionCategory(next.categoryId);
        if (currentCategory.type !== typeValue) {
          next.categoryId = getDefaultCategoryId(typeValue);
        }
      }

      return next;
    });

    setLocalErrors((current) => {
      if (!(key in current)) return current;
      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function handleDateChange(text: string) {
    setDateText(text);
    const parsed = parseDateInput(text);
    if (parsed) {
      updateValue("date", parsed);
    } else {
      setValues((current) => ({ ...current, date: "" }));
      setLocalErrors((current) => ({ ...current, date: undefined }));
    }
  }

  function handleSubmit() {
    const validation = validateTransactionInput({
      type: values.type,
      amount: values.amount,
      currency: selectedWallet?.currency ?? values.currency,
      walletId: values.walletId,
      categoryId: values.categoryId,
      concept: values.concept,
      notes: values.notes,
      date: values.date,
    });

    if (!validation.ok) {
      setLocalErrors(toTransactionFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
  }

  const symbol = getCurrencySymbol(selectedWallet?.currency ?? values.currency);

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
                {isEditing ? "Editar movimiento" : "Nuevo movimiento"}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
                {isEditing
                  ? "Ajusta el importe, la fecha o la categoría."
                  : "Registra un gasto o ingreso en tu cartera."}
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar formulario"
              hitSlop={10}
              onPress={onCancel}
              disabled={submitting}
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
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={errorColor}
                />
                <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.typeRow}>
              {TRANSACTION_TYPE_OPTIONS.map((option) => {
                const selected = values.type === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => updateValue("type", option.value)}
                    disabled={submitting}
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

            <ThemedText style={styles.label}>Importe</ThemedText>
            <View
              style={[
                styles.amountWrapper,
                {
                  backgroundColor: surface,
                  borderColor: errors.amount ? errorColor : border,
                },
              ]}
            >
              <ThemedText style={[styles.amountSymbol, { color: mutedColor }]}>
                {symbol}
              </ThemedText>
              <TextInput
                value={values.amount}
                onChangeText={(value) => updateValue("amount", value)}
                placeholder="0,00"
                placeholderTextColor={mutedColor}
                keyboardType="decimal-pad"
                inputMode="decimal"
                editable={!submitting}
                accessibilityLabel="Importe"
                style={[styles.amountInput, { color: textColor }]}
              />
            </View>
            {errors.amount ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.amount}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Cartera</ThemedText>
            {wallets.length === 0 ? (
              <View style={[styles.infoBanner, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText style={[styles.infoText, { color: mutedColor }]}>
                  No tienes carteras. Crea una en la pestaña "Carteras" para poder registrar movimientos.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.walletList}>
                {wallets.map((wallet) => {
                  const selected = values.walletId === wallet.id;
                  return (
                    <Pressable
                      key={wallet.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={wallet.name}
                      onPress={() => updateValue("walletId", wallet.id)}
                      disabled={submitting}
                      style={[
                        styles.walletItem,
                        {
                          backgroundColor: selected ? "rgba(10, 126, 164, 0.12)" : surface,
                          borderColor: selected ? "#0A7EA4" : border,
                        },
                      ]}
                    >
                      <View style={styles.walletItemText}>
                        <ThemedText type="defaultSemiBold" numberOfLines={1}>
                          {wallet.name}
                        </ThemedText>
                        <ThemedText style={[styles.metaText, { color: mutedColor }]}>
                          {wallet.currency} · {wallet.type === "bank" ? "Banco" : wallet.type === "cash" ? "Efectivo" : "Otra"}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.walletBalance, { color: selected ? "#0A7EA4" : mutedColor }]}>
                        {getCurrencySymbol(wallet.currency)} {wallet.balance.toFixed(2).replace(".", ",")}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {errors.walletId ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.walletId}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Categoría</ThemedText>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const selected = values.categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={category.label}
                    onPress={() => updateValue("categoryId", category.id)}
                    disabled={submitting}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: selected ? "rgba(10, 126, 164, 0.12)" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={selected ? "#0A7EA4" : mutedColor}
                    />
                    <ThemedText
                      style={[
                        styles.categoryText,
                        { color: selected ? "#0A7EA4" : textColor },
                      ]}
                      numberOfLines={1}
                    >
                      {category.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {errors.categoryId ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.categoryId}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Concepto</ThemedText>
            <TextInput
              value={values.concept}
              onChangeText={(value) => updateValue("concept", value)}
              placeholder="Ej. Compra supermercado"
              placeholderTextColor={mutedColor}
              maxLength={TRANSACTION_CONCEPT_MAX_LENGTH}
              editable={!submitting}
              accessibilityLabel="Concepto"
              style={[
                styles.input,
                {
                  backgroundColor: surface,
                  borderColor: errors.concept ? errorColor : border,
                  color: textColor,
                },
              ]}
            />
            {errors.concept ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.concept}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Fecha</ThemedText>
            <TextInput
              value={dateText}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={mutedColor}
              editable={!submitting}
              accessibilityLabel="Fecha"
              style={[
                styles.input,
                {
                  backgroundColor: surface,
                  borderColor: errors.date ? errorColor : border,
                  color: textColor,
                },
              ]}
            />
            {errors.date ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.date}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.helper, { color: mutedColor }]}>
                Por defecto se usa hoy.
              </ThemedText>
            )}

            <ThemedText style={styles.label}>Notas (opcional)</ThemedText>
            <TextInput
              value={values.notes}
              onChangeText={(value) => updateValue("notes", value)}
              placeholder="Añade detalles adicionales"
              placeholderTextColor={mutedColor}
              maxLength={TRANSACTION_NOTES_MAX_LENGTH}
              editable={!submitting}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Notas"
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: surface,
                  borderColor: errors.notes ? errorColor : border,
                  color: textColor,
                },
              ]}
            />
            <View style={styles.descriptionFooter}>
              {errors.notes ? (
                <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                  {errors.notes}
                </ThemedText>
              ) : (
                <View />
              )}
              <ThemedText style={[styles.counter, { color: mutedColor }]}>
                {values.notes.length}/{TRANSACTION_NOTES_MAX_LENGTH}
              </ThemedText>
            </View>

            <View style={styles.actions}>
              {isEditing && onDelete ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar movimiento"
                  onPress={onDelete}
                  disabled={submitting}
                  style={[
                    styles.deleteButton,
                    submitting && styles.disabled,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#C62828" />
                  <ThemedText style={styles.deleteButtonText}>
                    Eliminar
                  </ThemedText>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                onPress={onCancel}
                disabled={submitting}
                style={[
                  styles.secondaryButton,
                  { borderColor: border, backgroundColor: surface },
                  submitting && styles.disabled,
                ]}
              >
                <ThemedText type="defaultSemiBold">Cancelar</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isEditing ? "Guardar cambios" : "Crear movimiento"}
                onPress={handleSubmit}
                disabled={submitting || wallets.length === 0}
                style={[
                  styles.primaryButton,
                  (submitting || wallets.length === 0) && styles.disabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    {isEditing ? "Guardar" : "Crear"}
                  </ThemedText>
                )}
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: "#8A1C1C",
    fontSize: 14,
    lineHeight: 20,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 10,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  walletList: {
    gap: 8,
  },
  walletItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  walletItemText: {
    flex: 1,
    marginRight: 10,
  },
  metaText: {
    fontSize: 13,
    marginTop: 2,
  },
  walletBalance: {
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  counter: {
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
    flexWrap: "wrap",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(198, 40, 40, 0.1)",
  },
  deleteButtonText: {
    color: "#C62828",
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#0A7EA4",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});

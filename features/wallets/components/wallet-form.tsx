import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
import { CURRENCIES } from "@/shared/constants/currencies";

import {
  toWalletFieldErrors,
  validateWalletInput,
  WalletInput,
  WalletValidationErrors,
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_NAME_MAX_LENGTH,
} from "../schemas/wallet.schema";
import { WalletFormValues } from "../types/wallet.types";
import { getCurrencySymbol } from "../utils/money";
import {
  DEFAULT_WALLET_FORM_VALUES,
  WALLET_COLORS,
  WALLET_ICONS,
  WALLET_TYPE_OPTIONS,
} from "../utils/wallet-options";

export interface WalletFormProps {
  submitting: boolean;
  error?: string | null;
  fieldErrors?: WalletValidationErrors;
  onSubmit: (input: WalletInput) => void;
  onCancel: () => void;
}

export function WalletForm({
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
}: WalletFormProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const background = isDark ? "#151718" : "#F7FAFB";
  const surface = isDark ? "#1C2225" : "#FFFFFF";
  const border = isDark ? "#2B3438" : "#DCE6E9";
  const textColor = isDark ? "#ECEDEE" : "#11181C";
  const mutedColor = isDark ? "#9BA1A6" : "#5C6B70";
  const errorColor = "#C62828";

  const [values, setValues] = useState<WalletFormValues>(
    DEFAULT_WALLET_FORM_VALUES,
  );
  const [localErrors, setLocalErrors] = useState<WalletValidationErrors>({});

  const errors: WalletValidationErrors = { ...localErrors, ...fieldErrors };

  function updateValue<K extends keyof WalletFormValues>(
    key: K,
    value: WalletFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setLocalErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleSubmit() {
    const validation = validateWalletInput(values);

    if (!validation.ok) {
      setLocalErrors(toWalletFieldErrors(validation.error));
      return;
    }

    setLocalErrors({});
    onSubmit(validation.value);
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
                Nueva cartera
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
                Configura dónde guardarás tu dinero.
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

            <ThemedText style={styles.label}>Nombre</ThemedText>
            <TextInput
              value={values.name}
              onChangeText={(value) => updateValue("name", value)}
              placeholder="Ej. Cuenta principal"
              placeholderTextColor={mutedColor}
              maxLength={WALLET_NAME_MAX_LENGTH}
              editable={!submitting}
              accessibilityLabel="Nombre de la cartera"
              style={[
                styles.input,
                {
                  backgroundColor: surface,
                  borderColor: errors.name ? errorColor : border,
                  color: textColor,
                },
              ]}
            />
            {errors.name ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.name}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Saldo inicial</ThemedText>
            <View
              style={[
                styles.balanceWrapper,
                {
                  backgroundColor: surface,
                  borderColor: errors.initialBalance ? errorColor : border,
                },
              ]}
            >
              <ThemedText style={[styles.balanceSymbol, { color: mutedColor }]}>
                {getCurrencySymbol(values.currency)}
              </ThemedText>
              <TextInput
                value={values.initialBalance}
                onChangeText={(value) => updateValue("initialBalance", value)}
                placeholder="0,00"
                placeholderTextColor={mutedColor}
                keyboardType="decimal-pad"
                inputMode="decimal"
                editable={!submitting}
                accessibilityLabel="Saldo inicial"
                style={[styles.balanceInput, { color: textColor }]}
              />
            </View>
            {errors.initialBalance ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.initialBalance}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.helper, { color: mutedColor }]}>
                Si lo dejas vacío se usará 0.
              </ThemedText>
            )}

            <ThemedText style={styles.label}>Moneda</ThemedText>
            <View style={styles.chipsWrap}>
              {CURRENCIES.map((currency) => {
                const selected = values.currency === currency.code;

                return (
                  <Pressable
                    key={currency.code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Moneda ${currency.name}`}
                    onPress={() => updateValue("currency", currency.code)}
                    disabled={submitting}
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
                      {currency.code} {currency.symbol}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {errors.currency ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.currency}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Tipo</ThemedText>
            <View style={styles.chipsWrap}>
              {WALLET_TYPE_OPTIONS.map((option) => {
                const selected = values.type === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Tipo ${option.label}`}
                    onPress={() => updateValue("type", option.value)}
                    disabled={submitting}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected ? "#0A7EA4" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={17}
                      color={selected ? "#FFFFFF" : mutedColor}
                    />
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        { color: selected ? "#FFFFFF" : textColor },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {errors.type ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.type}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Icono</ThemedText>
            <View style={styles.iconGrid}>
              {WALLET_ICONS.map((icon) => {
                const selected = values.icon === icon;

                return (
                  <Pressable
                    key={icon}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Icono ${icon}`}
                    onPress={() => updateValue("icon", icon)}
                    disabled={submitting}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: selected ? "#0A7EA4" : surface,
                        borderColor: selected ? "#0A7EA4" : border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={selected ? "#FFFFFF" : mutedColor}
                    />
                  </Pressable>
                );
              })}
            </View>
            {errors.icon ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.icon}
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Color</ThemedText>
            <View style={styles.colorRow}>
              {WALLET_COLORS.map((color) => {
                const selected = values.color === color;

                return (
                  <Pressable
                    key={color}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Color ${color}`}
                    onPress={() => updateValue("color", color)}
                    disabled={submitting}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selected && { borderColor: textColor },
                    ]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {errors.color ? (
              <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                {errors.color}
              </ThemedText>
            ) : null}

            <View
              style={[
                styles.switchRow,
                { backgroundColor: surface, borderColor: border },
              ]}
            >
              <View style={styles.switchText}>
                <ThemedText type="defaultSemiBold">
                  Incluir en el total
                </ThemedText>
                <ThemedText style={[styles.helper, { color: mutedColor }]}>
                  Se sumará al saldo del dashboard.
                </ThemedText>
              </View>
              <Switch
                value={values.includeInTotal}
                onValueChange={(value) =>
                  updateValue("includeInTotal", value)
                }
                disabled={submitting}
                trackColor={{ false: border, true: "#0A7EA4" }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Incluir cartera en el total"
              />
            </View>

            <ThemedText style={styles.label}>Descripción (opcional)</ThemedText>
            <TextInput
              value={values.description}
              onChangeText={(value) => updateValue("description", value)}
              placeholder="Ej. Cuenta para gastos del día a día"
              placeholderTextColor={mutedColor}
              maxLength={WALLET_DESCRIPTION_MAX_LENGTH}
              editable={!submitting}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Descripción de la cartera"
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: surface,
                  borderColor: errors.description ? errorColor : border,
                  color: textColor,
                },
              ]}
            />
            <View style={styles.descriptionFooter}>
              {errors.description ? (
                <ThemedText style={[styles.fieldError, { color: errorColor }]}>
                  {errors.description}
                </ThemedText>
              ) : (
                <View />
              )}
              <ThemedText style={[styles.counter, { color: mutedColor }]}>
                {values.description.length}/{WALLET_DESCRIPTION_MAX_LENGTH}
              </ThemedText>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar creación de cartera"
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
                accessibilityLabel="Crear cartera"
                onPress={handleSubmit}
                disabled={submitting}
                style={[
                  styles.primaryButton,
                  submitting && styles.disabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    Crear cartera
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
  balanceWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  balanceSymbol: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
    minWidth: 20,
  },
  balanceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
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
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
  },
  switchText: {
    flex: 1,
    paddingRight: 12,
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
  disabled: {
    opacity: 0.6,
  },
});

import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { useCategoryForm } from "../hooks/use-category-form";
import {
  CategoryInput,
  CategoryValidationErrors,
} from "../schemas/category.schema";
import { categoryFormStyles as styles } from "../styles/category-form.styles";
import { Category, CategoryType } from "../types/category.types";
import { buildCategoryFormValues } from "../utils/category-form-defaults";
import { CategoryFormActions } from "./category-form-actions";
import { CategoryFormColorSelector } from "./category-form-color-selector";
import { CategoryFormHeader } from "./category-form-header";
import { CategoryFormIconSelector } from "./category-form-icon-selector";
import { CategoryFormNameField } from "./category-form-name-field";
import { CategoryFormTypeSelector } from "./category-form-type-selector";

export interface CategoryFormProps {
  category: Category | null;
  defaultType: CategoryType;
  lockType?: boolean;
  submitting: boolean;
  error?: string | null;
  fieldErrors?: CategoryValidationErrors;
  onSubmit: (input: CategoryInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function CategoryForm({
  category,
  defaultType,
  lockType = false,
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
  onDelete,
}: CategoryFormProps) {
  const theme = useFormTheme();
  const isEditing = Boolean(category);
  const typeLocked = lockType || isEditing;
  const { values, errors, updateValue, submit } = useCategoryForm({
    initialValues: buildCategoryFormValues(category, defaultType),
    fieldErrors,
    onSubmit,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ThemedView
          style={styles.container}
          lightColor={theme.background}
          darkColor={theme.background}
        >
          <CategoryFormHeader
            isEditing={isEditing}
            disabled={submitting}
            onClose={onCancel}
          />

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
                  color={theme.danger}
                />
                <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
              </View>
            ) : null}

            <CategoryFormNameField
              value={values.name}
              error={errors.name}
              disabled={submitting}
              onChange={(value) => updateValue("name", value)}
            />

            <ThemedText style={styles.label}>Tipo</ThemedText>
            <CategoryFormTypeSelector
              value={values.type}
              locked={typeLocked}
              disabled={submitting}
              onChange={(type) => updateValue("type", type)}
            />
            {errors.type ? (
              <ThemedText style={styles.fieldError}>{errors.type}</ThemedText>
            ) : null}
            {typeLocked ? (
              <ThemedText style={[styles.helper, { color: theme.muted }]}>
                El tipo no se puede cambiar una vez creada la categoría.
              </ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Icono</ThemedText>
            <CategoryFormIconSelector
              value={values.icon}
              disabled={submitting}
              onChange={(icon) => updateValue("icon", icon)}
            />
            {errors.icon ? (
              <ThemedText style={styles.fieldError}>{errors.icon}</ThemedText>
            ) : null}

            <ThemedText style={styles.label}>Color</ThemedText>
            <CategoryFormColorSelector
              value={values.color}
              disabled={submitting}
              onChange={(color) => updateValue("color", color)}
            />
            {errors.color ? (
              <ThemedText style={styles.fieldError}>{errors.color}</ThemedText>
            ) : null}

            <CategoryFormActions
              submitting={submitting}
              isEditing={isEditing}
              onCancel={onCancel}
              onSubmit={submit}
              onDelete={onDelete}
            />
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

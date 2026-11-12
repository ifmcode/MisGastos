import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
import { CategoryFormAppearance } from "./category-form-appearance";
import { CategoryFormHeader } from "./category-form-header";
import { CategoryFormNameField } from "./category-form-name-field";

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
  const { t } = useTranslation("categories");
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
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.dangerSurface },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={theme.danger}
                />
                <ThemedText
                  style={[styles.errorBannerText, { color: theme.dangerText }]}
                >
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <CategoryFormNameField
              value={values.name}
              error={errors.name}
              disabled={submitting}
              onChange={(value) => updateValue("name", value)}
            />

            <CategoryFormAppearance
              values={values}
              errors={errors}
              typeLocked={typeLocked}
              disabled={submitting}
              onChange={updateValue}
            />

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

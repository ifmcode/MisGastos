import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useCategoriesScreen } from "../hooks/use-categories-screen";
import {
  categoriesPalette,
  categoriesStyles as styles,
} from "../styles/categories.styles";
import { Category } from "../types/category.types";
import { getCategoriesEmptyCopy } from "../utils/category-filters";
import { CategoriesEmptyState } from "./categories-empty-state";
import { CategoriesErrorState } from "./categories-error-state";
import { CategoriesHeader } from "./categories-header";
import { CategoriesLoadingState } from "./categories-loading-state";
import { CategoriesTypeFilter } from "./categories-type-filter";
import { CategoryCard } from "./category-card";
import { CategoryFormModal } from "./category-form-modal";

function CategorySeparator() {
  return <View style={styles.separator} />;
}

export function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    categories,
    visibleCategories,
    typeFilter,
    setTypeFilter,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    mutating,
    mutationError,
    mutationFieldErrors,
    visible,
    formCategory,
    defaultType,
    openCreate,
    openEdit,
    close,
    submit,
    requestDelete,
  } = useCategoriesScreen();

  const canAdd = !loading && !error;
  const emptyCopy = getCategoriesEmptyCopy(
    categories.length > 0,
    typeFilter,
  );

  function renderCategory({ item }: { item: Category }) {
    return (
      <CategoryCard category={item} onPress={() => openEdit(item)} />
    );
  }

  return (
    <ThemedView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <CategoriesHeader
        showAddButton={canAdd}
        onAddPress={openCreate}
        onBack={() => router.back()}
      />

      {loading ? (
        <CategoriesLoadingState />
      ) : error ? (
        <CategoriesErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <FlatList
          data={visibleCategories}
          keyExtractor={(category) => category.id}
          renderItem={renderCategory}
          ItemSeparatorComponent={CategorySeparator}
          ListHeaderComponent={
            categories.length > 0 ? (
              <CategoriesTypeFilter
                selected={typeFilter}
                onSelect={setTypeFilter}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <CategoriesEmptyState
              title={emptyCopy.title}
              message={emptyCopy.message}
              onCreate={openCreate}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            categories.length === 0 && styles.emptyListContent,
          ]}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          showsVerticalScrollIndicator={false}
        />
      )}

      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Añadir categoría"
          onPress={openCreate}
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
        >
          <Ionicons name="add" size={30} color={categoriesPalette.onPrimary} />
        </Pressable>
      ) : null}

      <CategoryFormModal
        visible={visible}
        category={formCategory ?? null}
        defaultType={defaultType}
        submitting={mutating}
        error={mutationError}
        fieldErrors={mutationFieldErrors}
        onSubmit={(input) => void submit(input)}
        onClose={close}
        onDelete={requestDelete}
      />
    </ThemedView>
  );
}

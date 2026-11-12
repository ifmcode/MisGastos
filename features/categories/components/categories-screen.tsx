import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";

import { useCategoriesScreen } from "../hooks/use-categories-screen";
import {
  categoriesPalette,
  categoriesStyles as styles,
} from "../styles/categories.styles";
import { CategoriesErrorState } from "./categories-error-state";
import { CategoriesHeader } from "./categories-header";
import { CategoriesList } from "./categories-list";
import { CategoriesLoadingState } from "./categories-loading-state";
import { CategoryFormModal } from "./category-form-modal";

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
    reorder,
    openCreate,
    openEdit,
    close,
    submit,
    deleteEditing,
  } = useCategoriesScreen();

  const canAdd = !loading && !error && !reorder.reordering;

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
        <CategoriesList
          categories={categories}
          visibleCategories={visibleCategories}
          typeFilter={typeFilter}
          refreshing={refreshing}
          reorder={reorder}
          onSelectFilter={setTypeFilter}
          onSelectCategory={openEdit}
          onCreateCategory={openCreate}
          onRefresh={() => void refresh()}
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
        onDelete={deleteEditing}
      />
    </ThemedView>
  );
}

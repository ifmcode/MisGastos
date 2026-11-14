import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { ErrorState } from "@/shared/components/molecules/error-state";
import { Fab } from "@/shared/components/molecules/fab";
import { LoadingState } from "@/shared/components/molecules/loading-state";

import { useCategoriesScreen } from "../hooks/use-categories-screen";
import { categoriesStyles as styles } from "../styles/categories.styles";
import { CategoriesHeader } from "./categories-header";
import { CategoriesList } from "./categories-list";
import { CategoryFormModal } from "./category-form-modal";

export function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(["categories", "common"]);
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
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <CategoriesHeader
        showAddButton={canAdd}
        onAddPress={openCreate}
        onBack={() => router.back()}
      />

      {loading ? (
        <LoadingState message={t("loading")} />
      ) : error ? (
        <ErrorState
          title={t("errorTitle")}
          message={error}
          retryLabel={t("common:actions.retry")}
          retryAccessibilityLabel={t("retryAccessibility")}
          onRetry={() => void reload()}
        />
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
        <Fab
          accessibilityLabel={t("add")}
          bottom={insets.bottom + 24}
          onPress={openCreate}
        />
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

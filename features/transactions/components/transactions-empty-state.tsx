import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsEmptyStateProps {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}

export function TransactionsEmptyState({
  hasFilters,
  onCreate,
  onClearFilters,
}: TransactionsEmptyStateProps) {
  const { t } = useTranslation("transactions");

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="receipt-outline"
          size={36}
          color={transactionsPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {hasFilters ? t("emptyFilteredTitle") : t("emptyTitle")}
      </ThemedText>
      <ThemedText style={styles.centeredText}>
        {hasFilters ? t("emptyFilteredMessage") : t("emptyMessage")}
      </ThemedText>
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("filters.clearAccessibility")}
          onPress={onClearFilters}
          style={styles.secondaryEmptyButton}
        >
          <ThemedText style={styles.secondaryEmptyButtonText}>
            {t("filters.clearFilters")}
          </ThemedText>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("createFirst")}
          onPress={onCreate}
          style={styles.createButton}
        >
          <Ionicons
            name="add"
            size={20}
            color={transactionsPalette.onPrimary}
          />
          <ThemedText style={styles.createButtonText}>
            {t("create")}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

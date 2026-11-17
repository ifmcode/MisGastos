import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsHeaderProps {
  showActions: boolean;
  hasFilters: boolean;
  onOpenFilters: () => void;
}

/** Title and the filters action; creation lives in the FAB menu only. */
export function TransactionsHeader({
  showActions,
  hasFilters,
  onOpenFilters,
}: TransactionsHeaderProps) {
  const { t } = useTranslation("transactions");

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="title" style={styles.title}>
          {t("title")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>{t("subtitle")}</ThemedText>
      </View>

      {showActions ? (
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("filters.openAccessibility")}
            onPress={onOpenFilters}
            style={styles.headerIconButton}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={transactionsPalette.primary}
            />
            {hasFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

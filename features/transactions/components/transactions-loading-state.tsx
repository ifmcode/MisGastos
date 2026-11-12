import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export function TransactionsLoadingState() {
  const { t } = useTranslation("transactions");

  return (
    <View style={styles.centered}>
      <ActivityIndicator
        size="large"
        color={transactionsPalette.primary}
      />
      <ThemedText style={styles.centeredText}>
        {t("loading")}
      </ThemedText>
    </View>
  );
}

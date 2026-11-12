import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import {
  transactionsPalette,
  transactionsStyles as styles,
} from "../styles/transactions.styles";

export interface TransactionsFabProps {
  bottom: number;
  onPress: () => void;
}

export function TransactionsFab({ bottom, onPress }: TransactionsFabProps) {
  const { t } = useTranslation("transactions");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("add")}
      onPress={onPress}
      style={[styles.fab, { bottom }]}
    >
      <Ionicons name="add" size={30} color={transactionsPalette.onPrimary} />
    </Pressable>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { asTranslate } from "@/shared/i18n/translate";

import {
  transferHistoryPalette,
  transferHistoryStyles as styles,
} from "../styles/transfer-history.styles";
import { getTransferHistoryEmptyCopy } from "../utils/transfer-history";

export function TransferHistoryEmptyState() {
  const { t } = useTranslation("transfers");
  const tr = asTranslate(t);
  const copy = getTransferHistoryEmptyCopy();

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="swap-horizontal"
          size={36}
          color={transferHistoryPalette.primary}
        />
      </View>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {tr(copy.titleKey)}
      </ThemedText>
      <ThemedText style={styles.centeredText}>
        {tr(copy.messageKey)}
      </ThemedText>
    </View>
  );
}

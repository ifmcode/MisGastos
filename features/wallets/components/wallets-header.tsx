import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { SyncStatusButton } from "@/features/sync/components/sync-status-button";

import { walletsStyles } from "../styles/wallets.styles";

/**
 * Title and subtitle of the wallets tab. Creation lives only in the floating
 * action button, so there is no duplicate header action.
 */
export function WalletsHeader() {
  const { t } = useTranslation("wallets");

  return (
    <View style={walletsStyles.header}>
      <View style={walletsStyles.headerText}>
        <ThemedText type="title" style={walletsStyles.title}>
          {t("title")}
        </ThemedText>
        <ThemedText style={walletsStyles.subtitle}>
          {t("subtitle")}
        </ThemedText>
      </View>
      <SyncStatusButton />
    </View>
  );
}

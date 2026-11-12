import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

import { walletsPalette, walletsStyles } from "../styles/wallets.styles";

export function WalletsLoadingState() {
  const { t } = useTranslation("wallets");

  return (
    <View style={walletsStyles.centered}>
      <ActivityIndicator size="large" color={walletsPalette.primary} />
      <ThemedText style={walletsStyles.centeredText}>
        {t("loading")}
      </ThemedText>
    </View>
  );
}

import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";

/** Tab header: the friends tab has no back action. */
export function FriendsHeader() {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");

  return (
    <View style={styles.header}>
      <ThemedText type="title" style={styles.title}>
        {t("title")}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
        {t("subtitle")}
      </ThemedText>
    </View>
  );
}

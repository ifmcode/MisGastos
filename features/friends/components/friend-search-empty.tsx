import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { friendsStyles as styles } from "../styles/friends.styles";

/** Inline feedback when the exact email matches no account. */
export function FriendSearchEmpty() {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");

  return (
    <View
      style={[
        styles.resultCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText type="defaultSemiBold">{t("search.notFoundTitle")}</ThemedText>
      <ThemedText style={[styles.resultMeta, { color: theme.muted }]}>
        {t("search.notFoundMessage")}
      </ThemedText>
    </View>
  );
}

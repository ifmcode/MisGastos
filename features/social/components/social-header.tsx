import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { socialStyles as styles } from "../styles/social.styles";

/** Tab header: the Social tab has no back action. */
export function SocialHeader() {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("social");

  return (
    <View style={styles.header}>
      <ThemedText type="title">{t("title")}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.muted }]}>
        {t("subtitle")}
      </ThemedText>
    </View>
  );
}

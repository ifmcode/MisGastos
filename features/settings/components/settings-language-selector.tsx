import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { useAppLanguage } from "@/shared/hooks/use-app-language";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { asTranslate } from "@/shared/i18n/translate";
import {
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from "@/shared/types/language.types";

import { settingsStyles as styles } from "../styles/settings.styles";

const LANGUAGE_LABEL_KEYS: Record<AppLanguage, string> = {
  es: "language.spanish",
  en: "language.english",
};

/** Español/English selector; the active language is marked with a check. */
export function SettingsLanguageSelector() {
  const theme = useFormTheme();
  const { t } = useTranslation("settings");
  const tr = asTranslate(t);
  const { language, ready, setLanguage } = useAppLanguage();

  return (
    <View
      style={[
        styles.menuItem,
        styles.languageItem,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Ionicons name="globe-outline" size={20} color={theme.primary} />
      <View style={styles.languageContent}>
        <ThemedText type="defaultSemiBold">{t("language.label")}</ThemedText>
        <View style={styles.languageOptions}>
          {SUPPORTED_LANGUAGES.map((option) => {
            const selected = language === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: !ready }}
                accessibilityLabel={tr(LANGUAGE_LABEL_KEYS[option])}
                disabled={!ready}
                onPress={() => setLanguage(option)}
                style={[
                  styles.languageOption,
                  { borderColor: selected ? theme.primary : theme.border },
                  selected && { backgroundColor: theme.primarySoft },
                ]}
              >
                <ThemedText
                  style={{
                    color: selected ? theme.primary : theme.text,
                  }}
                >
                  {tr(LANGUAGE_LABEL_KEYS[option])}
                </ThemedText>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

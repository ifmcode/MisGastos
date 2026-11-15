import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { FRIEND_EMAIL_MAX_LENGTH } from "../schemas/friend.schema";
import { friendsStyles as styles } from "../styles/friends.styles";
import { FriendActionButton } from "./friend-action-button";

export interface FriendSearchFormProps {
  email: string;
  fieldError: string | null;
  searching: boolean;
  onChangeEmail: (value: string) => void;
  onSubmit: () => void;
}

/** Exact-email search block with inline validation. */
export function FriendSearchForm({
  email,
  fieldError,
  searching,
  onChangeEmail,
  onSubmit,
}: FriendSearchFormProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("friends");

  return (
    <View
      style={[
        styles.searchCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText type="defaultSemiBold">{t("search.title")}</ThemedText>

      <TextInput
        value={email}
        onChangeText={onChangeEmail}
        onSubmitEditing={onSubmit}
        placeholder={t("search.placeholder")}
        placeholderTextColor={theme.muted}
        accessibilityLabel={t("search.inputAccessibility")}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="search"
        maxLength={FRIEND_EMAIL_MAX_LENGTH}
        editable={!searching}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: fieldError ? theme.danger : theme.border,
            color: theme.text,
          },
        ]}
      />

      {fieldError ? (
        <ThemedText style={[styles.fieldError, { color: theme.danger }]}>
          {fieldError}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.searchHint, { color: theme.muted }]}>
          {t("search.hint")}
        </ThemedText>
      )}

      <View style={styles.searchActions}>
        <FriendActionButton
          label={searching ? t("search.searching") : t("search.action")}
          accessibilityLabel={t("search.actionAccessibility")}
          loading={searching}
          disabled={searching}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

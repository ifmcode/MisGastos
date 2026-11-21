import { TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";
import { useScopedTranslation } from "@/shared/hooks/use-scoped-translation";

import { groupJoinStyles as styles } from "../styles/group-join.styles";
import { GroupJoinActionButton } from "./group-join-action-button";

export interface GroupJoinCodeFieldProps {
  value: string;
  /** Already translated field error; replaces the helper when present. */
  fieldError: string | null;
  looking: boolean;
  /** Any lookup or send in flight; the field and the button are locked. */
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** Join-code input with local validation feedback and the lookup action. */
export function GroupJoinCodeField({
  value,
  fieldError,
  looking,
  busy,
  onChange,
  onSubmit,
}: GroupJoinCodeFieldProps) {
  const theme = useFormTheme();
  const { t } = useScopedTranslation("groups");

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
        {t("join.codeLabel")}
      </ThemedText>

      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={t("join.codePlaceholder")}
        placeholderTextColor={theme.muted}
        accessibilityLabel={t("join.codeAccessibility")}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={12}
        returnKeyType="search"
        editable={!busy}
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
        <ThemedText style={[styles.helper, { color: theme.muted }]}>
          {t("join.codeHelper")}
        </ThemedText>
      )}

      <View style={styles.actionRow}>
        <GroupJoinActionButton
          label={looking ? t("join.looking") : t("join.lookup")}
          accessibilityLabel={t("join.lookupAccessibility")}
          accessibilityHint={t("join.lookupHint")}
          loading={looking}
          disabled={busy}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

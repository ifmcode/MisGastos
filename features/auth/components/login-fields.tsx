import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import type { LoginFieldErrors, LoginValidationCode } from "../schemas/login.schema";
import { loginStyles as styles } from "../styles/login.styles";
import { AuthFeedback } from "./auth-feedback";

export interface LoginFieldsProps {
  isRegister: boolean;
  name: string;
  email: string;
  password: string;
  errors?: LoginFieldErrors;
  onChangeName: (name: string) => void;
  onChangeEmail: (email: string) => void;
  onChangePassword: (password: string) => void;
}

export function LoginFields({
  isRegister,
  name,
  email,
  password,
  errors = {},
  onChangeName,
  onChangeEmail,
  onChangePassword,
}: LoginFieldsProps) {
  const theme = useFormTheme();
  const { t } = useTranslation(["auth", "validation"]);

  function message(code: LoginValidationCode | undefined): string | undefined {
    return code ? t(`validation:auth.${code}`) : undefined;
  }

  return (
    <>
      {isRegister ? (
        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: errors.name ? theme.danger : theme.border,
                color: theme.text,
              },
            ]}
            placeholder={t("login.namePlaceholder")}
            placeholderTextColor={theme.muted}
            autoCapitalize="words"
            accessibilityLabel={t("login.nameLabel")}
            value={name}
            onChangeText={onChangeName}
          />
          <AuthFeedback message={message(errors.name)} />
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: errors.email ? theme.danger : theme.border,
              color: theme.text,
            },
          ]}
          placeholder={t("login.emailPlaceholder")}
          placeholderTextColor={theme.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel={t("login.emailLabel")}
          value={email}
          onChangeText={onChangeEmail}
        />
        <AuthFeedback message={message(errors.email)} />
      </View>

      <View style={styles.fieldGroup}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: errors.password ? theme.danger : theme.border,
              color: theme.text,
            },
          ]}
          placeholder={t("login.passwordPlaceholder")}
          placeholderTextColor={theme.muted}
          secureTextEntry
          accessibilityLabel={t("login.passwordLabel")}
          value={password}
          onChangeText={onChangePassword}
        />
        <AuthFeedback message={message(errors.password)} />
      </View>
    </>
  );
}

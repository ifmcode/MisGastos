import { TextInput, View } from "react-native";

import { useFormTheme } from "@/shared/hooks/use-form-theme";

import type { LoginFieldErrors } from "../schemas/login.schema";
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
            placeholder="Nombre"
            placeholderTextColor={theme.muted}
            autoCapitalize="words"
            accessibilityLabel="Nombre"
            value={name}
            onChangeText={onChangeName}
          />
          <AuthFeedback message={errors.name} />
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
          placeholder="Email"
          placeholderTextColor={theme.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Correo electrónico"
          value={email}
          onChangeText={onChangeEmail}
        />
        <AuthFeedback message={errors.email} />
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
          placeholder="Contraseña"
          placeholderTextColor={theme.muted}
          secureTextEntry
          accessibilityLabel="Contraseña"
          value={password}
          onChangeText={onChangePassword}
        />
        <AuthFeedback message={errors.password} />
      </View>
    </>
  );
}

import { TextInput } from "react-native";

import { loginPalette, loginStyles as styles } from "../styles/login.styles";

export interface LoginFieldsProps {
  isRegister: boolean;
  name: string;
  email: string;
  password: string;
  onChangeName: (name: string) => void;
  onChangeEmail: (email: string) => void;
  onChangePassword: (password: string) => void;
}

export function LoginFields({
  isRegister,
  name,
  email,
  password,
  onChangeName,
  onChangeEmail,
  onChangePassword,
}: LoginFieldsProps) {
  return (
    <>
      {isRegister ? (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor={loginPalette.placeholder}
          autoCapitalize="words"
          value={name}
          onChangeText={onChangeName}
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={loginPalette.placeholder}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={onChangeEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={loginPalette.placeholder}
        secureTextEntry
        value={password}
        onChangeText={onChangePassword}
      />
    </>
  );
}

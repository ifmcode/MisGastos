import { ThemedView } from "@/components/themed-view";

import { useLoginForm } from "../hooks/use-login-form";
import { loginStyles as styles } from "../styles/login.styles";
import { LoginActions } from "./login-actions";
import { LoginFields } from "./login-fields";
import { LoginHeader } from "./login-header";
import { LoginModeToggle } from "./login-mode-toggle";

export function LoginScreen() {
  const login = useLoginForm();

  return (
    <ThemedView style={styles.container}>
      <LoginHeader isRegister={login.isRegister} />

      <LoginFields
        isRegister={login.isRegister}
        name={login.name}
        email={login.email}
        password={login.password}
        onChangeName={login.setName}
        onChangeEmail={login.setEmail}
        onChangePassword={login.setPassword}
      />

      <LoginActions
        isRegister={login.isRegister}
        loading={login.loading}
        onSubmit={() => void login.submit()}
        onGoogleLogin={() => void login.googleLogin()}
      />

      <LoginModeToggle
        isRegister={login.isRegister}
        onToggle={login.toggleMode}
      />
    </ThemedView>
  );
}

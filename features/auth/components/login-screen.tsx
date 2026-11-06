import { ThemedView } from "@/components/themed-view";

import { useLoginForm } from "../hooks/use-login-form";
import { loginStyles as styles } from "../styles/login.styles";
import { LoginActions } from "./login-actions";
import { LoginFields } from "./login-fields";
import { LoginHeader } from "./login-header";
import { LoginModeToggle } from "./login-mode-toggle";
import { LoginPasswordReset } from "./login-password-reset";

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
        errors={login.fieldErrors}
        onChangeName={login.setName}
        onChangeEmail={login.setEmail}
        onChangePassword={login.setPassword}
      />

      <LoginActions
        isRegister={login.isRegister}
        loading={login.loading}
        emailError={login.emailError}
        googleError={login.googleError}
        onSubmit={() => void login.submit()}
        onGoogleLogin={() => void login.googleLogin()}
      />

      <LoginPasswordReset
        isRegister={login.isRegister}
        loading={login.loading}
        feedback={login.resetFeedback}
        onReset={() => void login.resetPassword()}
      />

      <LoginModeToggle
        isRegister={login.isRegister}
        onToggle={login.toggleMode}
      />
    </ThemedView>
  );
}

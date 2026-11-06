import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";

import { useAuthService } from "../hooks/use-auth-service";
import { useEmailVerification } from "../hooks/use-email-verification";
import { loginStyles } from "../styles/login.styles";
import { AuthFeedback } from "./auth-feedback";
import { VerifyEmailActions } from "./verify-email-actions";
import { VerifyEmailHeader } from "./verify-email-header";

export function VerifyEmailScreen() {
  const { user } = useAuth();
  const authService = useAuthService();
  const verification = useEmailVerification();

  if (!user) {
    return null;
  }

  return (
    <ThemedView style={loginStyles.container}>
      <VerifyEmailHeader email={user.email} />

      <AuthFeedback
        message={verification.feedback?.message}
        tone={verification.feedback?.tone}
        variant="banner"
      />

      <VerifyEmailActions
        sending={verification.sending}
        checking={verification.checking}
        onResend={() => void verification.resend()}
        onCheck={() => void verification.checkStatus()}
        onLogout={() => void authService.logout()}
      />
    </ThemedView>
  );
}

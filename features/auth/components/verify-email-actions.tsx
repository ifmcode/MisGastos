import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { loginPalette, loginStyles } from "../styles/login.styles";
import { verifyEmailStyles as styles } from "../styles/verify-email.styles";

export interface VerifyEmailActionsProps {
  sending: boolean;
  checking: boolean;
  onResend: () => void;
  onCheck: () => void;
  onLogout: () => void;
}

/** Resend, manual check and the sign-out recovery path. */
export function VerifyEmailActions({
  sending,
  checking,
  onResend,
  onCheck,
  onLogout,
}: VerifyEmailActionsProps) {
  const theme = useFormTheme();
  const busy = sending || checking;

  return (
    <View style={styles.actions}>
      <Pressable
        style={[loginStyles.button, loginStyles.emailButton, busy && loginStyles.disabled]}
        onPress={onCheck}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Ya verifiqué mi correo"
        accessibilityState={{ disabled: busy, busy: checking }}
      >
        {checking ? (
          <ActivityIndicator color={loginPalette.onPrimary} />
        ) : (
          <ThemedText style={loginStyles.buttonText}>
            Ya verifiqué mi correo
          </ThemedText>
        )}
      </Pressable>

      <Pressable
        style={[
          styles.secondaryButton,
          { borderColor: theme.primary, backgroundColor: theme.surface },
          busy && loginStyles.disabled,
        ]}
        onPress={onResend}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Reenviar correo de verificación"
        accessibilityState={{ disabled: busy, busy: sending }}
      >
        {sending ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <ThemedText style={[styles.secondaryText, { color: theme.primary }]}>
            Reenviar correo
          </ThemedText>
        )}
      </Pressable>

      <Pressable
        style={styles.logoutButton}
        onPress={onLogout}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión y usar otra cuenta"
        accessibilityState={{ disabled: busy }}
      >
        <ThemedText style={[styles.logoutText, { color: theme.muted }]}>
          Cerrar sesión
        </ThemedText>
      </Pressable>
    </View>
  );
}

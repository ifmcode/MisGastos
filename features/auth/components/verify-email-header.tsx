import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useFormTheme } from "@/shared/hooks/use-form-theme";

import { verifyEmailStyles as styles } from "../styles/verify-email.styles";

export interface VerifyEmailHeaderProps {
  email: string | null;
}

/** Explains why the user is here and which address must be confirmed. */
export function VerifyEmailHeader({ email }: VerifyEmailHeaderProps) {
  const theme = useFormTheme();

  return (
    <View style={styles.header}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="mail-unread-outline" size={30} color={theme.primary} />
      </View>

      <ThemedText type="title" style={styles.title}>
        Verifica tu correo
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Confirma tu dirección para continuar usando la app.
      </ThemedText>

      {email ? (
        <ThemedText type="defaultSemiBold" style={styles.email}>
          {email}
        </ThemedText>
      ) : null}

      <ThemedText style={styles.hint}>
        Abre el enlace del correo y vuelve aquí. Comprobaremos el estado
        automáticamente.
      </ThemedText>
    </View>
  );
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/missing-email": "Ingresa tu correo electrónico.",
  "auth/user-not-found": "No encontramos una cuenta con ese correo.",
  "auth/wrong-password": "El correo o la contraseña no son correctos.",
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/invalid-login-credentials":
    "El correo o la contraseña no son correctos.",
  "auth/email-already-in-use": "Ya existe una cuenta con este correo.",
  "auth/weak-password":
    "La contraseña debe tener al menos 6 caracteres.",
  "auth/user-disabled":
    "Esta cuenta está deshabilitada. Contacta con el soporte.",
  "auth/too-many-requests":
    "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed":
    "No hay conexión. Comprueba tu red e inténtalo de nuevo.",
  "auth/requires-recent-login":
    "Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.",
  "auth/operation-not-allowed":
    "Este método de inicio de sesión no está disponible.",
  "auth/operation-not-supported-in-this-environment":
    "El inicio de sesión con Google necesita la app instalada; no funciona en Expo Go.",
  "auth/play-services-not-available":
    "Actualiza Google Play Services para iniciar sesión con Google.",
  "auth/missing-google-id-token":
    "Google no devolvió los datos necesarios. Inténtalo de nuevo.",
  "auth/google-missing-client-id":
    "El inicio de sesión con Google no está configurado en esta compilación.",
  "auth/unauthorized-domain":
    "Este dominio no está autorizado en Firebase para iniciar sesión con Google.",
  "auth/configuration-not-found":
    "El inicio de sesión con Google no está configurado en Firebase.",
  "auth/popup-closed-by-user": "Se canceló el inicio de sesión con Google.",
  "auth/cancelled-popup-request":
    "Se canceló el inicio de sesión con Google.",
  "auth/popup-blocked":
    "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
  "auth/account-exists-with-different-credential":
    "Ya existe una cuenta con este correo usando otro método de inicio de sesión.",
  "auth/credential-already-in-use":
    "Esta cuenta ya está vinculada a otro método de inicio de sesión.",
};

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Translates Firebase Auth errors into clear Spanish messages without
 * exposing raw provider text to the user.
 */
export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = getAuthErrorCode(error);

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  return fallback;
}

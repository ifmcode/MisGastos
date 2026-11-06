export interface LoginFormValues {
  name: string;
  email: string;
  password: string;
  isRegister: boolean;
}

export interface LoginFieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getLoginEmailError(email: string): string | undefined {
  const normalizedEmail = email.trim();

  if (normalizedEmail.length === 0) {
    return "Ingresa tu correo electrónico.";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "Ingresa un correo electrónico válido.";
  }

  return undefined;
}

export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const emailError = getLoginEmailError(values.email);

  if (values.isRegister && values.name.trim().length === 0) {
    errors.name = "Ingresa tu nombre.";
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (values.password.length === 0) {
    errors.password = "Ingresa tu contraseña.";
  } else if (values.isRegister && values.password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  return errors;
}

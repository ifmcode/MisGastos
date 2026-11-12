export interface LoginFormValues {
  name: string;
  email: string;
  password: string;
  isRegister: boolean;
}

export type LoginValidationCode =
  | "NAME_REQUIRED"
  | "EMAIL_REQUIRED"
  | "EMAIL_INVALID"
  | "PASSWORD_REQUIRED"
  | "PASSWORD_TOO_SHORT";

export type LoginFieldErrors = Partial<
  Record<"name" | "email" | "password", LoginValidationCode>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getLoginEmailError(
  email: string,
): LoginValidationCode | undefined {
  const normalizedEmail = email.trim();

  if (normalizedEmail.length === 0) {
    return "EMAIL_REQUIRED";
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return "EMAIL_INVALID";
  }

  return undefined;
}

export function validateLoginForm(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const emailError = getLoginEmailError(values.email);

  if (values.isRegister && values.name.trim().length === 0) {
    errors.name = "NAME_REQUIRED";
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (values.password.length === 0) {
    errors.password = "PASSWORD_REQUIRED";
  } else if (values.isRegister && values.password.length < 6) {
    errors.password = "PASSWORD_TOO_SHORT";
  }

  return errors;
}

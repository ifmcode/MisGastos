import { describe, expect, it } from "@jest/globals";

import {
  getLoginEmailError,
  validateLoginForm,
} from "../login.schema";

describe("validateLoginForm", () => {
  it("requires email and password on login without requiring the name", () => {
    const errors = validateLoginForm({
      name: "",
      email: "",
      password: "",
      isRegister: false,
    });

    expect(errors.name).toBeUndefined();
    expect(errors.email).toBe("Ingresa tu correo electrónico.");
    expect(errors.password).toBe("Ingresa tu contraseña.");
  });

  it("requires the name on registration", () => {
    const errors = validateLoginForm({
      name: "   ",
      email: "user@example.com",
      password: "secret123",
      isRegister: true,
    });

    expect(errors.name).toBe("Ingresa tu nombre.");
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeUndefined();
  });

  it("rejects an invalid email", () => {
    const errors = validateLoginForm({
      name: "",
      email: "not-an-email",
      password: "secret123",
      isRegister: false,
    });

    expect(errors.email).toBe("Ingresa un correo electrónico válido.");
  });

  it("enforces the minimum password length only on registration", () => {
    const loginErrors = validateLoginForm({
      name: "",
      email: "user@example.com",
      password: "123",
      isRegister: false,
    });
    const registerErrors = validateLoginForm({
      name: "User",
      email: "user@example.com",
      password: "123",
      isRegister: true,
    });

    expect(loginErrors.password).toBeUndefined();
    expect(registerErrors.password).toBe(
      "La contraseña debe tener al menos 6 caracteres.",
    );
  });

  it("returns no errors for valid values", () => {
    expect(
      validateLoginForm({
        name: "User",
        email: "user@example.com",
        password: "secret123",
        isRegister: true,
      }),
    ).toEqual({});
  });
});

describe("getLoginEmailError", () => {
  it("ignores surrounding whitespace", () => {
    expect(getLoginEmailError("  user@example.com  ")).toBeUndefined();
  });
});

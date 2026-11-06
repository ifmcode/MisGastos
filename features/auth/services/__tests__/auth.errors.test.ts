import { describe, expect, it } from "@jest/globals";

import { getAuthErrorMessage } from "../auth.errors";

function errorWithCode(code: string): Error {
  return Object.assign(new Error("provider detail"), { code });
}

describe("getAuthErrorMessage", () => {
  it("maps invalid credentials and unknown emails", () => {
    const expected = "El correo o la contraseña no son correctos.";

    expect(
      getAuthErrorMessage(errorWithCode("auth/wrong-password"), "fallback"),
    ).toBe(expected);
    expect(
      getAuthErrorMessage(errorWithCode("auth/invalid-credential"), "fallback"),
    ).toBe(expected);
    expect(
      getAuthErrorMessage(errorWithCode("auth/invalid-login-credentials"), "fallback"),
    ).toBe(expected);
  });

  it("maps unknown emails", () => {
    expect(
      getAuthErrorMessage(errorWithCode("auth/user-not-found"), "fallback"),
    ).toBe("No encontramos una cuenta con ese correo.");
  });

  it("maps email and password validation errors", () => {
    expect(
      getAuthErrorMessage(errorWithCode("auth/invalid-email"), "fallback"),
    ).toBe("El correo electrónico no es válido.");
    expect(
      getAuthErrorMessage(errorWithCode("auth/email-already-in-use"), "fallback"),
    ).toBe("Ya existe una cuenta con este correo.");
    expect(
      getAuthErrorMessage(errorWithCode("auth/weak-password"), "fallback"),
    ).toBe("La contraseña debe tener al menos 6 caracteres.");
  });

  it("maps rate limits and connection failures", () => {
    expect(
      getAuthErrorMessage(errorWithCode("auth/too-many-requests"), "fallback"),
    ).toBe("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
    expect(
      getAuthErrorMessage(errorWithCode("auth/network-request-failed"), "fallback"),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
  });

  it("maps Google popup failures", () => {
    expect(
      getAuthErrorMessage(
        errorWithCode("auth/popup-closed-by-user"),
        "fallback",
      ),
    ).toBe("Se canceló el inicio de sesión con Google.");
    expect(
      getAuthErrorMessage(errorWithCode("auth/popup-blocked"), "fallback"),
    ).toBe(
      "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
    );
  });

  it("returns the fallback for unknown errors without leaking raw text", () => {
    expect(getAuthErrorMessage(new Error("raw detail"), "fallback")).toBe(
      "fallback",
    );
    expect(getAuthErrorMessage("not an error", "fallback")).toBe("fallback");
    expect(getAuthErrorMessage(null, "fallback")).toBe("fallback");
  });
});

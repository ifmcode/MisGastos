import { describe, expect, it } from "@jest/globals";

import {
  getWalletErrorMessage,
  WalletValidationError,
} from "../wallet.errors";

function errorWithCode(code: string): Error {
  return Object.assign(new Error("provider detail"), { code });
}

describe("getWalletErrorMessage", () => {
  it("returns the validation message for validation errors", () => {
    const error = new WalletValidationError([
      {
        field: "name",
        code: "NAME_REQUIRED",
        message: "El nombre es obligatorio.",
      },
    ]);

    expect(getWalletErrorMessage(error, "fallback")).toBe(
      "El nombre es obligatorio.",
    );
  });

  it("translates permission errors", () => {
    expect(
      getWalletErrorMessage(errorWithCode("permission-denied"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");

    expect(
      getWalletErrorMessage(new Error("7 PERMISSION_DENIED"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");
  });

  it("translates connection errors", () => {
    expect(
      getWalletErrorMessage(errorWithCode("unavailable"), "fallback"),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");

    expect(
      getWalletErrorMessage(
        errorWithCode("network-request-failed"),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
  });

  it("falls back for unknown errors", () => {
    expect(getWalletErrorMessage(new Error("unknown"), "fallback")).toBe(
      "fallback",
    );
    expect(getWalletErrorMessage("not an error", "fallback")).toBe("fallback");
    expect(getWalletErrorMessage(null, "fallback")).toBe("fallback");
  });
});

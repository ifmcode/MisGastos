import { describe, expect, it } from "@jest/globals";

import {
  CategoryOperationCode,
  CategoryOperationError,
  CategoryValidationError,
  getCategoryErrorMessage,
} from "../category.errors";

const codes: CategoryOperationCode[] = [
  "CATEGORY_NOT_FOUND",
  "CATEGORY_IN_USE",
  "CATEGORY_TYPE_LOCKED",
];

describe("category errors", () => {
  it("exposes every operation code with a message", () => {
    for (const code of codes) {
      const error = new CategoryOperationError(code);

      expect(error.name).toBe("CategoryOperationError");
      expect(error.code).toBe(code);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });

  it("maps validation issues to their first message and field errors", () => {
    const error = new CategoryValidationError([
      { field: "name", code: "NAME_REQUIRED", message: "Nombre obligatorio" },
      { field: "name", code: "NAME_TOO_LONG", message: "Nombre largo" },
    ]);

    expect(error.name).toBe("CategoryValidationError");
    expect(error.message).toBe("Nombre obligatorio");
    expect(error.fieldErrors).toEqual({ name: "Nombre obligatorio" });
  });

  it("has a fallback message and maps infrastructure failures", () => {
    expect(new CategoryValidationError([]).message).toBe(
      "Los datos de la categoría no son válidos.",
    );
    expect(getCategoryErrorMessage(new CategoryOperationError("CATEGORY_IN_USE"), "fallback")).toBe(
      "No puedes eliminar una categoría que ya se usa en movimientos.",
    );
    expect(
      getCategoryErrorMessage(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "fallback",
      ),
    ).toBe("No tienes permisos para realizar esta operación.");
    expect(
      getCategoryErrorMessage(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
    expect(
      getCategoryErrorMessage(
        Object.assign(new Error("offline"), { code: "network-request-failed" }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
    expect(
      getCategoryErrorMessage(new Error("permission_denied"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");
    expect(getCategoryErrorMessage("boom", "fallback")).toBe("fallback");
  });
});

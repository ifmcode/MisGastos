import { describe, expect, it } from "@jest/globals";

import {
  getTransactionErrorMessage,
  TransactionOperationCode,
  TransactionOperationError,
  TransactionValidationError,
} from "../transaction.errors";

const codes: TransactionOperationCode[] = [
  "TRANSACTION_NOT_FOUND",
  "TRANSACTION_INVALID",
  "WALLET_NOT_FOUND",
  "WALLET_NOT_OWNED",
  "CURRENCY_MISMATCH",
  "CATEGORY_NOT_FOUND",
  "CATEGORY_TYPE_MISMATCH",
];

describe("TransactionValidationError", () => {
  it("uses the first issue message and maps the field errors", () => {
    const error = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
      { field: "concept", code: "CONCEPT_REQUIRED", message: "Concepto" },
    ]);

    expect(error.name).toBe("TransactionValidationError");
    expect(error.message).toBe("Importe inválido");
    expect(error.fieldErrors).toEqual({
      amount: "Importe inválido",
      concept: "Concepto",
    });
  });

  it("has a fallback message for empty issue lists", () => {
    const error = new TransactionValidationError([]);

    expect(error.message).toBe("Los datos del movimiento no son válidos.");
    expect(error.fieldErrors).toEqual({});
  });
});

describe("TransactionOperationError", () => {
  it("exposes every operation code with a user-friendly message", () => {
    for (const code of codes) {
      const error = new TransactionOperationError(code);

      expect(error.name).toBe("TransactionOperationError");
      expect(error.code).toBe(code);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});

describe("getTransactionErrorMessage", () => {
  it("returns the message of project errors", () => {
    const validation = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
    ]);
    const operation = new TransactionOperationError("WALLET_NOT_FOUND");

    expect(getTransactionErrorMessage(validation, "fallback")).toBe(
      "Importe inválido",
    );
    expect(getTransactionErrorMessage(operation, "fallback")).toBe(
      "La cartera asociada al movimiento ya no existe.",
    );
  });

  it("maps infrastructure error codes", () => {
    expect(
      getTransactionErrorMessage(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "fallback",
      ),
    ).toBe("No tienes permisos para realizar esta operación.");
    expect(
      getTransactionErrorMessage(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
    expect(
      getTransactionErrorMessage(
        Object.assign(new Error("offline"), { code: "network-request-failed" }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
  });

  it("maps permission messages written in the error text", () => {
    expect(
      getTransactionErrorMessage(new Error("permission-denied"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");
    expect(
      getTransactionErrorMessage(new Error("permission_denied"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");
  });

  it("returns the fallback for unknown failures", () => {
    expect(getTransactionErrorMessage("boom", "fallback")).toBe("fallback");
    expect(getTransactionErrorMessage(new Error("other"), "fallback")).toBe(
      "fallback",
    );
  });
});

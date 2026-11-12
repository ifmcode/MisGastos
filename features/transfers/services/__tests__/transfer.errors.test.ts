import { describe, expect, it } from "@jest/globals";

import {
  getTransferErrorMessage,
  TransferOperationCode,
  TransferOperationError,
  TransferValidationError,
} from "../transfer.errors";

const codes: TransferOperationCode[] = [
  "TRANSFER_INVALID",
  "TRANSFER_NOT_FOUND",
  "SAME_WALLET",
  "FROM_WALLET_NOT_FOUND",
  "TO_WALLET_NOT_FOUND",
  "WALLET_NOT_OWNED",
  "CURRENCY_MISMATCH",
  "INSUFFICIENT_FUNDS",
];

describe("TransferValidationError", () => {
  it("uses the first issue message and maps the field errors", () => {
    const error = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
      { field: "notes", code: "NOTES_TOO_LONG", message: "Notas largas" },
    ]);

    expect(error.name).toBe("TransferValidationError");
    expect(error.message).toBe("Importe inválido");
    expect(error.fieldErrors).toEqual({
      amount: "Importe inválido",
      notes: "Notas largas",
    });
  });

  it("has a fallback message for empty issue lists", () => {
    const error = new TransferValidationError([]);

    expect(error.message).toBe(
      "Los datos de la transferencia no son válidos.",
    );
    expect(error.fieldErrors).toEqual({});
  });
});

describe("TransferOperationError", () => {
  it("exposes every operation code with a user-friendly message", () => {
    for (const code of codes) {
      const error = new TransferOperationError(code);

      expect(error.name).toBe("TransferOperationError");
      expect(error.code).toBe(code);
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});

describe("getTransferErrorMessage", () => {
  it("returns the message of project errors", () => {
    const validation = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
    ]);
    const operation = new TransferOperationError("SAME_WALLET");

    expect(getTransferErrorMessage(validation, "fallback")).toBe(
      "Importe inválido",
    );
    expect(getTransferErrorMessage(operation, "fallback")).toBe(
      "La cartera de origen y destino deben ser distintas.",
    );
  });

  it("maps infrastructure error codes and messages", () => {
    expect(
      getTransferErrorMessage(
        Object.assign(new Error("denied"), { code: "permission-denied" }),
        "fallback",
      ),
    ).toBe("No tienes permisos para realizar esta operación.");
    expect(
      getTransferErrorMessage(
        Object.assign(new Error("offline"), { code: "unavailable" }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
    expect(
      getTransferErrorMessage(
        Object.assign(new Error("offline"), {
          code: "network-request-failed",
        }),
        "fallback",
      ),
    ).toBe("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
    expect(
      getTransferErrorMessage(new Error("permission_denied"), "fallback"),
    ).toBe("No tienes permisos para realizar esta operación.");
  });

  it("returns the fallback for unknown failures", () => {
    expect(getTransferErrorMessage("boom", "fallback")).toBe("fallback");
    expect(getTransferErrorMessage(new Error("other"), "fallback")).toBe(
      "fallback",
    );
  });
});

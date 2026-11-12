import { describe, expect, it } from "@jest/globals";

import {
  TransferOperationError,
  TransferValidationError,
} from "../../services/transfer.errors";
import { toTransferMutationError } from "../transfer-mutation-error";

describe("toTransferMutationError", () => {
  it("keeps the field errors of a validation failure", () => {
    const failure = new TransferValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
    ]);

    expect(toTransferMutationError(failure)).toEqual({
      message: "Importe inválido",
      fieldErrors: { amount: "Importe inválido" },
    });
  });

  it("returns the operation message without field errors", () => {
    const failure = new TransferOperationError("INSUFFICIENT_FUNDS");

    expect(toTransferMutationError(failure)).toEqual({
      message:
        "La cartera de origen no tiene saldo suficiente para esta transferencia.",
      fieldErrors: {},
    });
  });

  it("falls back for unknown failures", () => {
    expect(toTransferMutationError(new Error("permission-denied"))).toEqual({
      message: "No tienes permisos para realizar esta operación.",
      fieldErrors: {},
    });
    expect(toTransferMutationError("boom")).toEqual({
      message: "No se pudo crear la transferencia. Inténtalo de nuevo.",
      fieldErrors: {},
    });
  });
});

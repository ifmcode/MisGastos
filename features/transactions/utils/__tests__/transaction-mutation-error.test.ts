import { describe, expect, it } from "@jest/globals";

import {
  TransactionOperationError,
  TransactionValidationError,
} from "../../services/transaction.errors";
import { toTransactionMutationError } from "../transaction-mutation-error";

describe("toTransactionMutationError", () => {
  it("keeps the field errors of a validation failure", () => {
    const failure = new TransactionValidationError([
      { field: "amount", code: "INVALID_AMOUNT", message: "Importe inválido" },
    ]);

    expect(toTransactionMutationError(failure)).toEqual({
      message: "Importe inválido",
      fieldErrors: { amount: "Importe inválido" },
    });
  });

  it("returns the operation message without field errors", () => {
    const failure = new TransactionOperationError("WALLET_NOT_FOUND");

    expect(toTransactionMutationError(failure)).toEqual({
      message: "La cartera asociada al movimiento ya no existe.",
      fieldErrors: {},
    });
  });

  it("falls back for unknown failures", () => {
    expect(toTransactionMutationError(new Error("permission-denied"))).toEqual({
      message: "No tienes permisos para realizar esta operación.",
      fieldErrors: {},
    });
    expect(toTransactionMutationError("boom")).toEqual({
      message: "No se pudo guardar el movimiento. Inténtalo de nuevo.",
      fieldErrors: {},
    });
  });
});

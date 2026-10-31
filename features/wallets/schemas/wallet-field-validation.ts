import { isCurrencyCode } from "@/shared/constants/currencies";

import { isWalletIcon, isWalletType } from "../utils/wallet-options";
import { parseAmountInput } from "./wallet-amount";
import {
  WALLET_DESCRIPTION_MAX_LENGTH,
  WALLET_NAME_MAX_LENGTH,
  WalletInput,
  WalletValidationIssue,
} from "./wallet-validation.types";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function getNameIssue(input: WalletInput): WalletValidationIssue | null {
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (name.length === 0) {
    return {
      field: "name",
      code: "NAME_REQUIRED",
      message: "El nombre de la cartera es obligatorio.",
    };
  }

  if (name.length > WALLET_NAME_MAX_LENGTH) {
    return {
      field: "name",
      code: "NAME_TOO_LONG",
      message: `El nombre no puede superar los ${WALLET_NAME_MAX_LENGTH} caracteres.`,
    };
  }

  return null;
}

function getCurrencyIssue(input: WalletInput): WalletValidationIssue | null {
  if (isCurrencyCode(input.currency)) return null;

  return {
    field: "currency",
    code: "INVALID_CURRENCY",
    message: "Selecciona una moneda válida.",
  };
}

function getIconIssue(input: WalletInput): WalletValidationIssue | null {
  if (isWalletIcon(input.icon)) return null;

  return {
    field: "icon",
    code: "INVALID_ICON",
    message: "Selecciona un icono válido.",
  };
}

function getColorIssue(input: WalletInput): WalletValidationIssue | null {
  if (
    typeof input.color === "string" &&
    HEX_COLOR_PATTERN.test(input.color)
  ) {
    return null;
  }

  return {
    field: "color",
    code: "INVALID_COLOR",
    message: "Selecciona un color válido.",
  };
}

function getInitialBalanceIssue(
  input: WalletInput,
): WalletValidationIssue | null {
  const isNegativeAmount =
    typeof input.initialBalance === "number"
      ? input.initialBalance < 0
      : typeof input.initialBalance === "string" &&
        input.initialBalance.trim().startsWith("-");

  if (isNegativeAmount) {
    return {
      field: "initialBalance",
      code: "NEGATIVE_AMOUNT",
      message: "El saldo inicial no puede ser negativo.",
    };
  }

  if (parseAmountInput(input.initialBalance) === null) {
    return {
      field: "initialBalance",
      code: "INVALID_AMOUNT",
      message: "Introduce un importe válido con hasta 2 decimales.",
    };
  }

  return null;
}

function getTypeIssue(input: WalletInput): WalletValidationIssue | null {
  if (isWalletType(input.type)) return null;

  return {
    field: "type",
    code: "INVALID_TYPE",
    message: "Selecciona un tipo de cartera válido.",
  };
}

function getIncludeInTotalIssue(
  input: WalletInput,
): WalletValidationIssue | null {
  if (typeof input.includeInTotal === "boolean") return null;

  return {
    field: "includeInTotal",
    code: "INVALID_INCLUDE_IN_TOTAL",
    message: "El valor de incluir en el total no es válido.",
  };
}

function getDescriptionIssue(
  input: WalletInput,
): WalletValidationIssue | null {
  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  if (description.length <= WALLET_DESCRIPTION_MAX_LENGTH) return null;

  return {
    field: "description",
    code: "DESCRIPTION_TOO_LONG",
    message: `La descripción no puede superar los ${WALLET_DESCRIPTION_MAX_LENGTH} caracteres.`,
  };
}

/** Collects every field issue of a wallet input in display order. */
export function getWalletIssues(
  input: WalletInput,
): WalletValidationIssue[] {
  return [
    getNameIssue(input),
    getCurrencyIssue(input),
    getIconIssue(input),
    getColorIssue(input),
    getInitialBalanceIssue(input),
    getTypeIssue(input),
    getIncludeInTotalIssue(input),
    getDescriptionIssue(input),
  ].filter((issue): issue is WalletValidationIssue => issue !== null);
}

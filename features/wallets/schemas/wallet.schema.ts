import { isCurrencyCode } from "@/shared/constants/currencies";
import { Result } from "@/shared/types/common.types";

import { CreateWalletDto } from "../types/wallet.types";
import { isWalletIcon, isWalletType } from "../utils/wallet-options";
import { roundMoney } from "../utils/money";

export const WALLET_NAME_MAX_LENGTH = 40;
export const WALLET_DESCRIPTION_MAX_LENGTH = 160;
export const WALLET_MAX_AMOUNT = 999_999_999_999.99;

const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type WalletFormField =
  | "ownerId"
  | "name"
  | "currency"
  | "icon"
  | "color"
  | "initialBalance"
  | "type"
  | "includeInTotal"
  | "description";

export type WalletValidationCode =
  | "OWNER_REQUIRED"
  | "NAME_REQUIRED"
  | "NAME_TOO_LONG"
  | "INVALID_CURRENCY"
  | "INVALID_ICON"
  | "INVALID_COLOR"
  | "INVALID_AMOUNT"
  | "NEGATIVE_AMOUNT"
  | "INVALID_TYPE"
  | "INVALID_INCLUDE_IN_TOTAL"
  | "DESCRIPTION_TOO_LONG";

export interface WalletValidationIssue {
  field: WalletFormField;
  code: WalletValidationCode;
  message: string;
}

export type WalletValidationErrors = Partial<Record<WalletFormField, string>>;

/**
 * Input accepted by business validation. `currency`, `type` and `icon` are
 * strings here so values coming from forms or Firestore are checked at runtime.
 */
export interface WalletInput {
  name: string;
  currency: string;
  icon: string;
  color: string;
  initialBalance: string | number;
  type: string;
  includeInTotal: boolean;
  description?: string | null;
}

/**
 * Parses a user-entered amount. An empty value means 0 (initial balance is
 * optional), commas are accepted as decimal separators and at most 2 decimals
 * are allowed. Negative values are rejected.
 */
export function parseAmountInput(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    if (value > WALLET_MAX_AMOUNT) return null;
    return roundMoney(value);
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (normalized === "") return 0;

  const withDot = normalized.replace(",", ".");
  if (!AMOUNT_PATTERN.test(withDot)) return null;

  const parsed = Number(withDot);
  if (!Number.isFinite(parsed) || parsed > WALLET_MAX_AMOUNT) return null;

  return roundMoney(parsed);
}

export function validateWalletInput(
  input: WalletInput,
): Result<CreateWalletDto, WalletValidationIssue[]> {
  const issues: WalletValidationIssue[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length === 0) {
    issues.push({
      field: "name",
      code: "NAME_REQUIRED",
      message: "El nombre de la cartera es obligatorio.",
    });
  } else if (name.length > WALLET_NAME_MAX_LENGTH) {
    issues.push({
      field: "name",
      code: "NAME_TOO_LONG",
      message: `El nombre no puede superar los ${WALLET_NAME_MAX_LENGTH} caracteres.`,
    });
  }

  if (!isCurrencyCode(input.currency)) {
    issues.push({
      field: "currency",
      code: "INVALID_CURRENCY",
      message: "Selecciona una moneda válida.",
    });
  }

  if (!isWalletIcon(input.icon)) {
    issues.push({
      field: "icon",
      code: "INVALID_ICON",
      message: "Selecciona un icono válido.",
    });
  }

  if (
    typeof input.color !== "string" ||
    !HEX_COLOR_PATTERN.test(input.color)
  ) {
    issues.push({
      field: "color",
      code: "INVALID_COLOR",
      message: "Selecciona un color válido.",
    });
  }

  const isNegativeAmount =
    typeof input.initialBalance === "number"
      ? input.initialBalance < 0
      : typeof input.initialBalance === "string" &&
        input.initialBalance.trim().startsWith("-");

  const initialBalance = isNegativeAmount
    ? null
    : parseAmountInput(input.initialBalance);

  if (isNegativeAmount) {
    issues.push({
      field: "initialBalance",
      code: "NEGATIVE_AMOUNT",
      message: "El saldo inicial no puede ser negativo.",
    });
  } else if (initialBalance === null) {
    issues.push({
      field: "initialBalance",
      code: "INVALID_AMOUNT",
      message: "Introduce un importe válido con hasta 2 decimales.",
    });
  }

  if (!isWalletType(input.type)) {
    issues.push({
      field: "type",
      code: "INVALID_TYPE",
      message: "Selecciona un tipo de cartera válido.",
    });
  }

  if (typeof input.includeInTotal !== "boolean") {
    issues.push({
      field: "includeInTotal",
      code: "INVALID_INCLUDE_IN_TOTAL",
      message: "El valor de incluir en el total no es válido.",
    });
  }

  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  if (description.length > WALLET_DESCRIPTION_MAX_LENGTH) {
    issues.push({
      field: "description",
      code: "DESCRIPTION_TOO_LONG",
      message: `La descripción no puede superar los ${WALLET_DESCRIPTION_MAX_LENGTH} caracteres.`,
    });
  }

  if (issues.length > 0) {
    return { ok: false, error: issues };
  }

  return {
    ok: true,
    value: {
      name,
      currency: input.currency,
      icon: input.icon,
      color: input.color.toUpperCase(),
      initialBalance: initialBalance ?? 0,
      type: input.type,
      includeInTotal: input.includeInTotal,
      ...(description.length > 0 ? { description } : {}),
    } as CreateWalletDto,
  };
}

export function toWalletFieldErrors(
  issues: readonly WalletValidationIssue[],
): WalletValidationErrors {
  return issues.reduce<WalletValidationErrors>((errors, issue) => {
    if (!errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
    return errors;
  }, {});
}

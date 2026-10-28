import { isCurrencyCode } from "@/shared/constants/currencies";

import { Wallet } from "../types/wallet.types";
import { roundMoney } from "../utils/money";
import {
  isWalletIcon,
  isWalletType,
  WALLET_COLORS,
} from "../utils/wallet-options";

const EPOCH_ISO = new Date(0).toISOString();
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface TimestampLike {
  toDate(): Date;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as { toDate?: unknown };
  return typeof candidate.toDate === "function";
}

function toIsoDate(value: unknown): string | null {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (isTimestampLike(value)) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return roundMoney(value);
}

function readNonNegativeNumber(value: unknown): number | null {
  const parsed = readNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

/**
 * Converts a Firestore document into a Wallet. Invalid documents return null
 * so a single malformed record cannot break the whole wallet list.
 */
export function mapWalletDocument(
  id: string,
  data: Record<string, unknown>,
  ownerId: string,
): Wallet | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name.length === 0) return null;

  if (!isCurrencyCode(data.currency)) return null;
  if (!isWalletType(data.type)) return null;

  const initialBalance = readNonNegativeNumber(data.initialBalance) ?? 0;
  const balance = readNumber(data.balance) ?? initialBalance;
  const icon = isWalletIcon(data.icon) ? data.icon : "wallet";

  const color =
    typeof data.color === "string" && HEX_COLOR_PATTERN.test(data.color)
      ? data.color.toUpperCase()
      : WALLET_COLORS[0];

  const includeInTotal =
    typeof data.includeInTotal === "boolean" ? data.includeInTotal : true;

  const description =
    typeof data.description === "string" && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;

  const storedOwnerId =
    typeof data.ownerId === "string" && data.ownerId.trim().length > 0
      ? data.ownerId
      : ownerId;

  const createdAt = toIsoDate(data.createdAt) ?? EPOCH_ISO;
  const updatedAt = toIsoDate(data.updatedAt) ?? createdAt;

  return {
    id,
    name,
    currency: data.currency,
    icon,
    color,
    initialBalance,
    balance,
    type: data.type,
    includeInTotal,
    ownerId: storedOwnerId,
    createdAt,
    updatedAt,
    ...(description ? { description } : {}),
  };
}

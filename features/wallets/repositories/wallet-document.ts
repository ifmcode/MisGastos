import { CurrencyCode } from "@/shared/constants/currencies";
import { INITIAL_REVISION } from "@/shared/utils/revision";

import { CreateWalletDto, WalletType } from "../types/wallet.types";
import { roundMoney } from "../utils/money";

/** Stored shape of a wallet document, shared by every wallet write. */
export interface WalletDocumentData {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: number;
  balance: number;
  type: WalletType;
  includeInTotal: boolean;
  ownerId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

/**
 * Single source of truth for the stored wallet shape. The create flow and the
 * default-wallet seed both use it so their writes cannot drift.
 */
export function buildWalletDocumentData(
  ownerId: string,
  dto: CreateWalletDto,
  now: string,
): WalletDocumentData {
  const initialBalance = roundMoney(dto.initialBalance);

  return {
    name: dto.name,
    currency: dto.currency,
    icon: dto.icon,
    color: dto.color,
    initialBalance,
    balance: initialBalance,
    type: dto.type,
    includeInTotal: dto.includeInTotal,
    ownerId,
    revision: INITIAL_REVISION,
    createdAt: now,
    updatedAt: now,
    ...(dto.description ? { description: dto.description } : {}),
  };
}

import { CurrencyCode } from "@/shared/constants/currencies";
import { BaseEntity } from "@/shared/types/common.types";

export type WalletType = "cash" | "bank" | "other";

export interface Wallet extends BaseEntity {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: number;
  balance: number;
  type: WalletType;
  includeInTotal: boolean;
  ownerId: string;
  description?: string;
}

export interface CreateWalletDto {
  name: string;
  currency: CurrencyCode;
  icon: string;
  color: string;
  initialBalance: number;
  type: WalletType;
  includeInTotal: boolean;
  description?: string;
}

export interface UpdateWalletDto {
  name?: string;
  currency?: CurrencyCode;
  icon?: string;
  color?: string;
  type?: WalletType;
  includeInTotal?: boolean;
  description?: string;
}

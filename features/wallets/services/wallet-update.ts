import { IWalletRepository } from "../repositories/wallet.repository";
import { WalletInput, validateWalletInput } from "../schemas/wallet.schema";
import { UpdateWalletDto, Wallet } from "../types/wallet.types";
import { roundMoney } from "../utils/money";
import {
  WalletOperationError,
  WalletValidationError,
} from "./wallet.errors";

/** Updates editable wallet data while protecting currency and initial balance. */
export async function updateWalletWithRepository(
  repository: IWalletRepository,
  ownerId: string,
  walletId: string,
  input: WalletInput,
): Promise<Wallet> {
  const validation = validateWalletInput(input);

  if (!validation.ok) {
    throw new WalletValidationError(validation.error);
  }

  const existing = await repository.getWallet(ownerId, walletId);
  if (!existing) throw new WalletOperationError("WALLET_NOT_FOUND");

  if (validation.value.currency !== existing.currency) {
    throw new WalletOperationError("CURRENCY_LOCKED");
  }

  const initialBalance = roundMoney(validation.value.initialBalance);
  const initialBalanceChanged = initialBalance !== existing.initialBalance;

  if (initialBalanceChanged) {
    const usage = await repository.getWalletUsage(ownerId, walletId);
    if (usage.hasMovements) {
      throw new WalletOperationError("INITIAL_BALANCE_LOCKED");
    }
  }

  const dto: UpdateWalletDto = {
    name: validation.value.name,
    icon: validation.value.icon,
    color: validation.value.color,
    type: validation.value.type,
    includeInTotal: validation.value.includeInTotal,
    description: validation.value.description ?? "",
    ...(initialBalanceChanged ? { initialBalance } : {}),
  };

  return repository.updateWallet(ownerId, walletId, dto);
}

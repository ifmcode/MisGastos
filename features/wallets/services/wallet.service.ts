import { IWalletRepository } from "../repositories/wallet.repository";
import {
  validateWalletInput,
  WalletInput,
  WalletValidationIssue,
} from "../schemas/wallet.schema";
import { CreateWalletDto, Wallet } from "../types/wallet.types";
import { calculateWalletBalance } from "../utils/money";
import { WalletValidationError } from "./wallet.errors";

export class WalletService {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async getWallets(ownerId: string): Promise<Wallet[]> {
    const normalizedOwnerId = ownerId.trim();

    if (normalizedOwnerId.length === 0) {
      throw new WalletValidationError([
        {
          field: "ownerId",
          code: "OWNER_REQUIRED",
          message: "Debes iniciar sesión para ver tus carteras.",
        },
      ]);
    }

    return this.walletRepository.getWallets(normalizedOwnerId);
  }

  async createWallet(ownerId: string, input: WalletInput): Promise<Wallet> {
    const normalizedOwnerId = ownerId.trim();
    const issues: WalletValidationIssue[] = [];

    if (normalizedOwnerId.length === 0) {
      issues.push({
        field: "ownerId",
        code: "OWNER_REQUIRED",
        message: "Debes iniciar sesión para crear una cartera.",
      });
    }

    const validation = validateWalletInput(input);

    if (!validation.ok) {
      throw new WalletValidationError([...issues, ...validation.error]);
    }

    if (issues.length > 0) {
      throw new WalletValidationError(issues);
    }

    const initialBalance = calculateWalletBalance(
      validation.value.initialBalance,
    );

    const dto: CreateWalletDto = {
      ...validation.value,
      initialBalance,
    };

    return this.walletRepository.createWallet(normalizedOwnerId, dto);
  }
}

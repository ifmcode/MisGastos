import { IWalletRepository } from "../repositories/wallet.repository";
import {
  validateWalletInput,
  WalletInput,
  WalletValidationIssue,
} from "../schemas/wallet.schema";
import {
  CreateWalletDto,
  DeleteWalletOptions,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";
import { calculateWalletBalance } from "../utils/money";
import { deleteWalletWithRepository } from "./wallet-delete";
import { WalletValidationError } from "./wallet.errors";
import {
  getOwnerIssue,
  normalizeOwnerId,
  normalizeWalletId,
} from "./wallet-owner";
import { updateWalletWithRepository } from "./wallet-update";

export class WalletService {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async getWallets(ownerId: string): Promise<Wallet[]> {
    return this.walletRepository.getWallets(
      normalizeOwnerId(ownerId, "ver tus carteras"),
    );
  }

  async createWallet(ownerId: string, input: WalletInput): Promise<Wallet> {
    const normalizedOwnerId = ownerId.trim();
    const issues: WalletValidationIssue[] = [];
    const validation = validateWalletInput(input);

    if (normalizedOwnerId.length === 0) {
      issues.push(getOwnerIssue("crear una cartera"));
    }

    if (!validation.ok) {
      throw new WalletValidationError([...issues, ...validation.error]);
    }

    if (issues.length > 0) {
      throw new WalletValidationError(issues);
    }

    const initialBalance = calculateWalletBalance(
      validation.value.initialBalance,
    );

    const dto: CreateWalletDto = { ...validation.value, initialBalance };

    return this.walletRepository.createWallet(normalizedOwnerId, dto);
  }

  async updateWallet(
    ownerId: string,
    walletId: string,
    input: WalletInput,
  ): Promise<Wallet> {
    return updateWalletWithRepository(
      this.walletRepository,
      normalizeOwnerId(ownerId, "editar carteras"),
      normalizeWalletId(walletId),
      input,
    );
  }

  async archiveWallet(ownerId: string, walletId: string): Promise<Wallet> {
    return this.setArchived(
      ownerId,
      walletId,
      new Date().toISOString(),
      "archivar carteras",
    );
  }

  async restoreWallet(ownerId: string, walletId: string): Promise<Wallet> {
    return this.setArchived(ownerId, walletId, null, "restaurar carteras");
  }

  async getWalletUsage(
    ownerId: string,
    walletId: string,
  ): Promise<WalletUsage> {
    return this.walletRepository.getWalletUsage(
      normalizeOwnerId(ownerId, "ver tus carteras"),
      normalizeWalletId(walletId),
    );
  }

  async deleteWallet(
    ownerId: string,
    walletId: string,
    options: DeleteWalletOptions,
  ): Promise<WalletDeletionResult> {
    return deleteWalletWithRepository(
      this.walletRepository,
      normalizeOwnerId(ownerId, "eliminar carteras"),
      normalizeWalletId(walletId),
      options,
    );
  }

  private async setArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
    action: string,
  ): Promise<Wallet> {
    return this.walletRepository.setWalletArchived(
      normalizeOwnerId(ownerId, action),
      normalizeWalletId(walletId),
      archivedAt,
    );
  }
}

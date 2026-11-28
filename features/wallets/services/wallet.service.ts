import { IWalletRepository } from "../repositories/wallet.repository";
import {
  validateWalletInput,
  WalletInput,
  WalletValidationIssue,
} from "../schemas/wallet.schema";
import {
  CreateWalletDto,
  DefaultWalletSeedResult,
  DeleteWalletOptions,
  SeedDefaultWalletInput,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";
import { buildDefaultWalletDto } from "../utils/default-wallet";
import { calculateWalletBalance } from "../utils/money";
import { deleteWalletWithRepository } from "./wallet-delete";
import { WalletValidationError } from "./wallet.errors";
import {
  getOwnerIssue,
  normalizeOwnerId,
  normalizeWalletId,
} from "./wallet-owner";
import { persistWalletOrder } from "./wallet-reorder";
import { updateWalletWithRepository } from "./wallet-update";

export class WalletService {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async getWallets(ownerId: string): Promise<Wallet[]> {
    return this.walletRepository.getWallets(normalizeOwnerId(ownerId));
  }

  async createWallet(ownerId: string, input: WalletInput): Promise<Wallet> {
    const normalizedOwnerId = ownerId.trim();
    const issues: WalletValidationIssue[] = [];
    const validation = validateWalletInput(input);

    if (normalizedOwnerId.length === 0) {
      issues.push(getOwnerIssue());
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

  /**
   * Seeds the account's main wallet on the first authenticated load. The DTO
   * comes from the shared wallet defaults so the seed cannot invent a different
   * icon, colour or type.
   */
  async seedDefaultWallet(
    ownerId: string,
    input: SeedDefaultWalletInput,
  ): Promise<DefaultWalletSeedResult> {
    const normalizedOwnerId = normalizeOwnerId(ownerId);
    const name = input.name.trim();

    if (name.length === 0) {
      throw new WalletValidationError([
        { field: "name", code: "NAME_REQUIRED" },
      ]);
    }

    return this.walletRepository.seedDefaultWallet(
      normalizedOwnerId,
      buildDefaultWalletDto(name, input.preferredCurrency),
    );
  }

  async updateWallet(
    ownerId: string,
    walletId: string,
    input: WalletInput,
  ): Promise<Wallet> {
    return updateWalletWithRepository(
      this.walletRepository,
      normalizeOwnerId(ownerId),
      normalizeWalletId(walletId),
      input,
    );
  }

  async archiveWallet(ownerId: string, walletId: string): Promise<Wallet> {
    return this.setArchived(ownerId, walletId, new Date().toISOString());
  }

  async restoreWallet(ownerId: string, walletId: string): Promise<Wallet> {
    return this.setArchived(ownerId, walletId, null);
  }

  async getWalletUsage(
    ownerId: string,
    walletId: string,
  ): Promise<WalletUsage> {
    return this.walletRepository.getWalletUsage(
      normalizeOwnerId(ownerId),
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
      normalizeOwnerId(ownerId),
      normalizeWalletId(walletId),
      options,
    );
  }

  /** Persists the requested wallet order; the helper normalises the owner. */
  async reorderWallets(
    ownerId: string,
    orderedIds: readonly string[],
  ): Promise<void> {
    await persistWalletOrder(this.walletRepository, ownerId, orderedIds);
  }

  private async setArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
  ): Promise<Wallet> {
    return this.walletRepository.setWalletArchived(
      normalizeOwnerId(ownerId),
      normalizeWalletId(walletId),
      archivedAt,
    );
  }
}

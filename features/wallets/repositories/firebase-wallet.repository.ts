import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { assertServerSnapshot } from "@/shared/lib/local-db/offline-read";

import {
  CreateWalletDto,
  DefaultWalletSeedResult,
  DeleteWalletOptions,
  UpdateWalletDto,
  Wallet,
  WalletDeletionResult,
  WalletUsage,
} from "../types/wallet.types";
import { deleteWalletDocument } from "./wallet-deletion.operation";
import { mapWalletDocument } from "./wallet.mapper";
import { loadWalletMovements, toWalletUsage } from "./wallet-movements";
import { seedDefaultWalletDocument } from "./wallet-seed.operation";
import { IWalletRepository } from "./wallet.repository";
import {
  createWalletDocument,
  setWalletArchivedDocument,
  updateWalletDocument,
} from "./wallet-write.operations";

const WALLET_COLLECTION = "wallets";

export class FirebaseWalletRepository implements IWalletRepository {
  async getWallets(ownerId: string): Promise<Wallet[]> {
    const walletsRef = collection(db, WALLET_COLLECTION);
    const snapshot = await getDocs(
      query(walletsRef, where("ownerId", "==", ownerId)),
    );
    assertServerSnapshot(snapshot);

    const wallets: Wallet[] = [];

    for (const document of snapshot.docs) {
      const wallet = mapWalletDocument(document.id, document.data(), ownerId);
      if (wallet) wallets.push(wallet);
    }

    // Wallet lists are small; sorting here avoids a composite index for
    // ownerId + createdAt. Revisit if pagination or shared wallets are added.
    return wallets.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
  }

  async getWallet(ownerId: string, walletId: string): Promise<Wallet | null> {
    const snapshot = await getDoc(doc(db, WALLET_COLLECTION, walletId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as Record<string, unknown>;
    if (data.ownerId !== ownerId) return null;

    return mapWalletDocument(snapshot.id, data, ownerId);
  }

  async createWallet(ownerId: string, dto: CreateWalletDto): Promise<Wallet> {
    return createWalletDocument(ownerId, dto);
  }

  async seedDefaultWallet(
    ownerId: string,
    dto: CreateWalletDto,
  ): Promise<DefaultWalletSeedResult> {
    return seedDefaultWalletDocument(ownerId, dto);
  }

  async updateWallet(
    ownerId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet> {
    return updateWalletDocument(ownerId, walletId, dto);
  }

  async setWalletArchived(
    ownerId: string,
    walletId: string,
    archivedAt: string | null,
  ): Promise<Wallet> {
    return setWalletArchivedDocument(ownerId, walletId, archivedAt);
  }

  async getWalletUsage(
    ownerId: string,
    walletId: string,
  ): Promise<WalletUsage> {
    const movements = await loadWalletMovements(ownerId, walletId);
    return toWalletUsage(movements);
  }

  async deleteWallet(
    ownerId: string,
    walletId: string,
    options: DeleteWalletOptions,
  ): Promise<WalletDeletionResult> {
    return deleteWalletDocument(ownerId, walletId, options);
  }
}

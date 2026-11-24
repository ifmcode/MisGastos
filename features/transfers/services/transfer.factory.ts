import { FirebaseWalletRepository } from "@/features/wallets/repositories/firebase-wallet.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedTransferRepository } from "../repositories/cached-transfer.repository";
import { FirebaseTransferRepository } from "../repositories/firebase-transfer.repository";
import { TransferService } from "./transfer.service";

let transferServiceInstance: TransferService | null = null;

export function getTransferService(): TransferService {
  if (!transferServiceInstance) {
    const remote = new FirebaseTransferRepository();
    const transferRepository = isOfflineFirstEnabled()
      ? new CachedTransferRepository(remote)
      : remote;
    const walletRepository = new FirebaseWalletRepository();
    transferServiceInstance = new TransferService(
      transferRepository,
      walletRepository,
    );
  }

  return transferServiceInstance;
}

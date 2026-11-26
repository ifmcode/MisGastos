import { CachedWalletRepository } from "@/features/wallets/repositories/cached-wallet.repository";
import { FirebaseWalletRepository } from "@/features/wallets/repositories/firebase-wallet.repository";
import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedTransferRepository } from "../repositories/cached-transfer.repository";
import { FirebaseTransferRepository } from "../repositories/firebase-transfer.repository";
import { OfflineTransferRepository } from "../repositories/offline-transfer.repository";
import { TransferService } from "./transfer.service";

let transferServiceInstance: TransferService | null = null;

export function getTransferService(): TransferService {
  if (!transferServiceInstance) {
    const offline = isOfflineFirstEnabled();
    const remote = new FirebaseTransferRepository();
    const transferRepository = offline
      ? new OfflineTransferRepository(new CachedTransferRepository(remote))
      : remote;
    // Offline validation needs the derived balance (server + pending delta).
    const walletRepository = offline
      ? new CachedWalletRepository(new FirebaseWalletRepository())
      : new FirebaseWalletRepository();
    transferServiceInstance = new TransferService(
      transferRepository,
      walletRepository,
    );
  }

  return transferServiceInstance;
}

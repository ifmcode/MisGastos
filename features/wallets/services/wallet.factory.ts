import { isOfflineFirstEnabled } from "@/shared/lib/local-db/offline-first.flag";

import { CachedWalletRepository } from "../repositories/cached-wallet.repository";
import { FirebaseWalletRepository } from "../repositories/firebase-wallet.repository";
import { WalletService } from "./wallet.service";

let walletServiceInstance: WalletService | null = null;

export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    const remote = new FirebaseWalletRepository();
    const repository = isOfflineFirstEnabled()
      ? new CachedWalletRepository(remote)
      : remote;
    walletServiceInstance = new WalletService(repository);
  }

  return walletServiceInstance;
}

import { FirebaseWalletRepository } from "@/features/wallets/repositories/firebase-wallet.repository";

import { FirebaseTransferRepository } from "../repositories/firebase-transfer.repository";
import { TransferService } from "./transfer.service";

let transferServiceInstance: TransferService | null = null;

export function getTransferService(): TransferService {
  if (!transferServiceInstance) {
    const transferRepository = new FirebaseTransferRepository();
    const walletRepository = new FirebaseWalletRepository();
    transferServiceInstance = new TransferService(
      transferRepository,
      walletRepository,
    );
  }

  return transferServiceInstance;
}

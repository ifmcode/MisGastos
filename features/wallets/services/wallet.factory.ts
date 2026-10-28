import { FirebaseWalletRepository } from "../repositories/firebase-wallet.repository";
import { WalletService } from "./wallet.service";

let walletServiceInstance: WalletService | null = null;

export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    const repository = new FirebaseWalletRepository();
    walletServiceInstance = new WalletService(repository);
  }

  return walletServiceInstance;
}

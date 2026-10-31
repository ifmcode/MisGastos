import { WalletInput } from "../../schemas/wallet.schema";
import { WalletService } from "../wallet.service";
import { FakeWalletRepository } from "./wallet-service.fakes";

export const validInput: WalletInput = {
  name: "  Cuenta principal  ",
  currency: "EUR",
  icon: "wallet",
  color: "#0a7ea4",
  initialBalance: "100,50",
  type: "bank",
  includeInTotal: true,
  description: "  Nómina  ",
};

export function createService() {
  const repository = new FakeWalletRepository();
  return { repository, service: new WalletService(repository) };
}

export async function captureError(
  promise: Promise<unknown>,
): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error("Expected promise to reject");
}

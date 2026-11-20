import { useDefaultWalletSeed } from "../hooks/use-default-wallet-seed";

/** Renders nothing; seeds the account's main wallet on the first load. */
export function DefaultWalletSeed(): null {
  useDefaultWalletSeed();

  return null;
}

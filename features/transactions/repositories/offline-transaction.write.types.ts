/** Single time source and id factory injected into every local write. */
export interface OfflineTransactionWriteDeps {
  now: () => string;
  createId: () => string;
}

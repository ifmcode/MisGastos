/** Single time source and id factory injected into every local write. */
export interface OfflineTransferWriteDeps {
  now: () => string;
  createId: () => string;
}

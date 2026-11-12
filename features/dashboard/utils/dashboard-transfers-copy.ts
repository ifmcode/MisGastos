export const TRANSFER_EMPTY_GUIDANCE_KEY = "transfers.guidance";
export const TRANSFER_EMPTY_REQUIREMENT_KEY = "transfers.requirement";

/** Returns the translation key for the dashboard transfer empty state. */
export function getTransfersEmptyMessageKey(canTransfer: boolean): string {
  return canTransfer
    ? TRANSFER_EMPTY_GUIDANCE_KEY
    : TRANSFER_EMPTY_REQUIREMENT_KEY;
}

import { useCallback, useState } from "react";

export interface UseGroupDetailSheetControllerOptions {
  /** Leaves the route after the viewer left the group. */
  onLeft?: () => void;
  /** Opens the settle route from the blocked-balance dialog. */
  onOpenSettle?: () => void;
}

export interface GroupDetailSheetController {
  detailsVisible: boolean;
  openDetails: () => void;
  closeDetails: () => void;
  /** Closes the sheet, then leaves the route after a successful departure. */
  handleLeft: () => void;
  /** Closes the sheet before the screen pushes the settle route. */
  openSettleFromDialog: () => void;
}

/**
 * Visibility of the details page sheet plus the two actions that must close it
 * before the screen navigates: leaving the group and settling a blocked balance.
 */
export function useGroupDetailSheetController({
  onLeft,
  onOpenSettle,
}: UseGroupDetailSheetControllerOptions): GroupDetailSheetController {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const openDetails = useCallback(() => setDetailsVisible(true), []);
  const closeDetails = useCallback(() => setDetailsVisible(false), []);
  const handleLeft = useCallback(() => {
    closeDetails();
    onLeft?.();
  }, [closeDetails, onLeft]);
  const openSettleFromDialog = useCallback(() => {
    closeDetails();
    onOpenSettle?.();
  }, [closeDetails, onOpenSettle]);

  return {
    detailsVisible,
    openDetails,
    closeDetails,
    handleLeft,
    openSettleFromDialog,
  };
}

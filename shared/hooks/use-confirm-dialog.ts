import { useRef, useState } from "react";

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const INITIAL_STATE: ConfirmDialogState = {
  visible: false,
  title: "",
  message: "",
};

export interface UseConfirmDialogResult extends ConfirmDialogState {
  open: (request: ConfirmDialogRequest) => void;
  close: () => void;
  confirm: () => void;
}

/** Owns the state and pending action of an in-app confirmation dialog. */
export function useConfirmDialog(): UseConfirmDialogResult {
  const [state, setState] = useState<ConfirmDialogState>(INITIAL_STATE);
  const actionRef = useRef<(() => void) | null>(null);

  function open(request: ConfirmDialogRequest) {
    actionRef.current = request.onConfirm;
    setState({
      visible: true,
      title: request.title,
      message: request.message,
      confirmLabel: request.confirmLabel,
      cancelLabel: request.cancelLabel,
    });
  }

  function close() {
    actionRef.current = null;
    setState((current) => ({ ...current, visible: false }));
  }

  function confirm() {
    const action = actionRef.current;
    close();
    action?.();
  }

  return { ...state, open, close, confirm };
}

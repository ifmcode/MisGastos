import type { ReactNode } from "react";
import { Modal, type ModalProps, View } from "react-native";

import { pageSheetFormModalStyles as styles } from "./page-sheet-form-modal.styles";

export interface PageSheetFormModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onDismiss?: () => void;
  presentationStyle?: ModalProps["presentationStyle"];
  children: ReactNode;
}

/** Page-sheet modal shell shared by the create and edit forms. */
export function PageSheetFormModal({
  visible,
  onRequestClose,
  onDismiss,
  presentationStyle = "pageSheet",
  children,
}: PageSheetFormModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      onRequestClose={onRequestClose}
      onDismiss={onDismiss}
    >
      {visible ? <View style={styles.root}>{children}</View> : null}
    </Modal>
  );
}

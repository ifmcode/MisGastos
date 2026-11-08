import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Fixed colors that do not depend on the active theme. */
export const confirmDialogPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
  onDanger: "#FFFFFF",
} as const;

export const confirmDialogStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 20,
  },
  backdrop: {
    ...absoluteFill,
    backgroundColor: confirmDialogPalette.backdrop,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.25)",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    minWidth: 100,
  },
  confirmButtonText: {
    color: confirmDialogPalette.onDanger,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});

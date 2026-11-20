import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Backdrop tone shared by the compact field dialog (theme-independent). */
export const currencyFieldPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const currencyFieldStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 48,
  },
  value: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});

export const currencyPickerDialogStyles = StyleSheet.create({
  overlay: {
    ...absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...absoluteFill,
    backgroundColor: currencyFieldPalette.backdrop,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.25)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexShrink: 1,
  },
});

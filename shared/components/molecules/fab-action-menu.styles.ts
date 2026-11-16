import { StyleSheet } from "react-native";

import { absoluteFill } from "@/shared/styles/absolute-fill";

/** Colors that do not depend on the active theme. */
export const fabActionMenuPalette = {
  backdrop: "rgba(17, 24, 28, 0.5)",
} as const;

export const fabActionMenuStyles = StyleSheet.create({
  overlay: {
    ...absoluteFill,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backdrop: {
    ...absoluteFill,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.25)",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});

import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const datePickerModalPalette = {
  backdrop: "rgba(0, 0, 0, 0.4)",
} as const;

export const datePickerModalStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: datePickerModalPalette.backdrop,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  action: {
    minHeight: 44,
    justifyContent: "center",
  },
});

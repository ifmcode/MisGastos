import { StyleSheet } from "react-native";

/** Layout of the primary settle action; colours come from `useFormTheme`. */
export const settleButtonStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});

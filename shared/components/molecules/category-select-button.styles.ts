import { StyleSheet } from "react-native";

/** Layout only: every colour comes from `useFormTheme`. */
export const categorySelectButtonStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  triggerEmpty: {
    borderStyle: "dashed",
  },
  triggerPressed: {
    opacity: 0.7,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
});

import { StyleSheet } from "react-native";

export const formActionsStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
    flexWrap: "wrap",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});

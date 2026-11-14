import { StyleSheet } from "react-native";

/** Shared layout for the form text, amount and notes fields. */
export const formFieldStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  descriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  counter: {
    fontSize: 12,
    marginTop: 6,
  },
  amountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 10,
  },
});

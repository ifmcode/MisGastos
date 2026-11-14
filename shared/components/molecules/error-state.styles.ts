import { StyleSheet } from "react-native";

export const errorStateStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  screenText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  errorTitle: {
    marginTop: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  inline: {
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  inlineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineRetryText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

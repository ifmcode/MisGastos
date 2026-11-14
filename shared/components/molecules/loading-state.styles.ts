import { StyleSheet } from "react-native";

export const loadingStateStyles = StyleSheet.create({
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
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  inlineText: {
    fontSize: 13,
    opacity: 0.7,
  },
});

import { StyleSheet } from "react-native";

export const errorBannerStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

import { StyleSheet } from "react-native";

/** Brand tints that keep the empty cards consistent across features. */
export const emptyStatePalette = {
  primaryBorder: "rgba(10, 126, 164, 0.4)",
  cardBorder: "rgba(10, 126, 164, 0.25)",
  cardSurface: "rgba(10, 126, 164, 0.06)",
} as const;

export const emptyStateStyles = StyleSheet.create({
  screen: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  icon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emptyStatePalette.primaryBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: emptyStatePalette.cardBorder,
    borderRadius: 16,
    padding: 16,
    backgroundColor: emptyStatePalette.cardSurface,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  cardMessage: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginTop: 4,
  },
});

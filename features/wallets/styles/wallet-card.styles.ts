import { StyleSheet } from "react-native";

import { walletsPalette } from "./wallets.styles";

export const walletCardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  archived: {
    opacity: 0.75,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: walletsPalette.primarySoftIcon,
  },
  badgeText: {
    color: walletsPalette.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.65,
    marginTop: 2,
  },
  balance: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  chevron: {
    marginLeft: 6,
  },
});

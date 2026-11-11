import { StyleSheet } from "react-native";

import { dashboardPalette } from "./dashboard.styles";

export const dashboardMovementsStyles = StyleSheet.create({
  list: {
    gap: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: dashboardPalette.primaryBorder,
    borderRadius: 16,
    padding: 16,
    backgroundColor: dashboardPalette.primarySoft,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginTop: 4,
  },
});

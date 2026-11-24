import { StyleSheet } from "react-native";

/**
 * Layout of the merged **Actividad del grupo** register inside the group detail.
 * Every colour comes from `useFormTheme`, so light and dark share the same
 * composition.
 */
export const groupActivityStyles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  list: {
    gap: 2,
  },
  empty: {
    paddingTop: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

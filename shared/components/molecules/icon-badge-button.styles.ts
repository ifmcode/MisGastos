import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`. The badge sizes keep the
 * original dashboard bell values so both screens render identically.
 */
export const iconBadgeButtonStyles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
});

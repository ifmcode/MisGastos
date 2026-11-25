import { StyleSheet } from "react-native";

/**
 * Layout only: the surfaces, text and border colours come from `useFormTheme`
 * and the vertical position is injected by the host, so light and dark mode
 * share one composition.
 */
export const offlineBannerStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    zIndex: 20,
    elevation: 20,
  },
  label: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});

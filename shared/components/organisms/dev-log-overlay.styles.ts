import { StyleSheet } from "react-native";

/** Top stack above every route; only the cards capture touches. */
export const devLogOverlayStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    gap: 8,
    zIndex: 50,
    elevation: 50,
  },
});

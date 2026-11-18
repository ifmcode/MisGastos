import { StyleSheet } from "react-native";

const FAB_SIZE = 58;

/**
 * Floating action buttons sit in the horizontal centre of the screen. The
 * negative margin is half the size because an absolutely positioned item cannot
 * be centred with `alignSelf`.
 */
export const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    left: "50%",
    marginLeft: -FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
});

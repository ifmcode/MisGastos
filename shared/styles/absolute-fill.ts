import type { ViewStyle } from "react-native";

/**
 * Absolute fill preset.
 * `StyleSheet.absoluteFillObject` was removed from React Native 0.88 types.
 */
export const absoluteFill: ViewStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

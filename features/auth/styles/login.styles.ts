import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const loginPalette = {
  primary: "#0A7EA4",
  primarySoft: "rgba(10, 126, 164, 0.12)",
  google: "#DB4437",
  onPrimary: "#FFFFFF",
  border: "#CCCCCC",
  text: "#333333",
  surface: "#FFFFFF",
  placeholder: "#999999",
  danger: "#C62828",
  dangerSurface: "#FDECEA",
  dangerText: "#8A1C1C",
} as const;

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },

  // Fields
  fieldGroup: {
    width: "100%",
    maxWidth: 340,
    marginBottom: 12,
    gap: 4,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: loginPalette.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: loginPalette.text,
    backgroundColor: loginPalette.surface,
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    color: loginPalette.danger,
  },

  // Feedback
  feedbackBanner: {
    width: "100%",
    maxWidth: 340,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // Actions
  button: {
    width: "100%",
    maxWidth: 340,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  emailButton: {
    backgroundColor: loginPalette.primary,
  },
  googleButton: {
    backgroundColor: loginPalette.google,
  },
  buttonText: {
    color: loginPalette.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  resetSection: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    marginTop: 8,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  resetText: {
    color: loginPalette.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Mode switch
  toggleButton: {
    marginTop: 20,
  },
  toggleText: {
    color: loginPalette.primary,
    fontSize: 14,
  },
});

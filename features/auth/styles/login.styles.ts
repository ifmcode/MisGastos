import { StyleSheet } from "react-native";

/** Shared tokens so components never repeat raw color values. */
export const loginPalette = {
  primary: "#0A7EA4",
  google: "#DB4437",
  onPrimary: "#FFFFFF",
  border: "#CCCCCC",
  text: "#333333",
  surface: "#FFFFFF",
  placeholder: "#999999",
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
  input: {
    width: "100%",
    maxWidth: 340,
    height: 48,
    borderWidth: 1,
    borderColor: loginPalette.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: loginPalette.text,
    backgroundColor: loginPalette.surface,
  },
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
  toggleButton: {
    marginTop: 24,
  },
  toggleText: {
    color: loginPalette.primary,
    fontSize: 14,
  },
});

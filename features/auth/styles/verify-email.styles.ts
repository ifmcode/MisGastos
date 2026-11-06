import { StyleSheet } from "react-native";

export const verifyEmailStyles = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
  email: {
    textAlign: "center",
  },
  hint: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginTop: 4,
  },
  actions: {
    width: "100%",
    maxWidth: 340,
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

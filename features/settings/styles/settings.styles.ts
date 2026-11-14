import { StyleSheet } from "react-native";

export const settingsPalette = {
  danger: "#DC3545",
  onDanger: "#FFFFFF",
} as const;

export const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  profileSection: {
    marginBottom: 16,
  },
  menu: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    flex: 1,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  languageItem: {
    alignItems: "flex-start",
  },
  languageContent: {
    flex: 1,
    gap: 8,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutButton: {
    backgroundColor: settingsPalette.danger,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: settingsPalette.onDanger,
    fontSize: 16,
    fontWeight: "600",
  },
});

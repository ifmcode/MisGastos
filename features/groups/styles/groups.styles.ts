import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition and no raw value is needed here.
 */
export const groupsStyles = StyleSheet.create({
  // Shared interaction states
  pressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },

  // Route headers
  container: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  routeHeaderText: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  routeTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  // Scroll bodies
  detailScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 18,
  },

  // Sections and list rows
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: {
    flex: 1,
    gap: 2,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
  },
  cardAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowBalance: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // Group detail header
  header: {
    gap: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headerIdentity: {
    flex: 1,
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    flexShrink: 1,
    fontSize: 26,
    lineHeight: 32,
  },
  headerActions: {
    flexDirection: "row",
    gap: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMeta: {
    gap: 2,
    paddingLeft: 2,
  },
  headerMetaLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  headerBalance: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  // Forms (create/edit and invite)
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  // Invitee multi-select
  inviteesHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  inviteesCount: {
    fontSize: 12,
    fontWeight: "700",
  },
  inviteeList: {
    gap: 8,
    marginTop: 10,
  },
  inviteeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  inviteeBody: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modals (details sheet)
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 18,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoBlock: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 21,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  memberBody: {
    flex: 1,
    gap: 2,
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  rowAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Received invitations route
  invitationCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  invitationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});

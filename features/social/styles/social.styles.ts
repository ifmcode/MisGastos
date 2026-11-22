import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition.
 */
export const socialStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 20,
  },
  routeScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },

  // Tab header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  headerText: {
    flex: 1,
  },

  // Route header with a back action
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

  // Segmented control
  segmentControl: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Groups segment: invitations row plus groups list
  groupsSegment: {
    gap: 12,
  },

  pressed: {
    opacity: 0.7,
  },
});

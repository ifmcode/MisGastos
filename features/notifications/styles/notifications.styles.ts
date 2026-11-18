import { StyleSheet } from "react-native";

/**
 * Layout only: every colour comes from `useFormTheme`, so light and dark mode
 * share the same composition.
 */
export const notificationsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 10,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  rowUnread: {
    borderWidth: 2,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  bell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },

  // Segmented control: base + variant, mirroring the Social pattern.
  segmentControl: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  segmentCount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    minWidth: 18,
    textAlign: "center",
  },

  // List header: action banner plus the mark-all-read action.
  listHeader: {
    gap: 8,
    paddingTop: 2,
  },
  markAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Floating banner: layout only, it must never capture empty space.
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingRight: 2,
  },
  bannerBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  bannerMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  bannerClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Height of the bottom tab bar, mirroring `TABBAR_HEIGHT_UIKIT` in
 * `@react-navigation/bottom-tabs`' `BottomTabBar`. The navigator adds the
 * bottom inset on top of it, hence the sum in `getBannerBottomOffset`.
 */
export const TAB_BAR_HEIGHT = 49;

/**
 * Routes rendered by the tabs navigator. A new tab must be added here too, or
 * the offline strip will sit on top of its tab bar instead of above it.
 */
export const TAB_ROUTES: readonly string[] = [
  "/",
  "/wallets",
  "/transactions",
  "/social",
  "/settings",
];

export interface BannerOffsetInput {
  isTabRoute: boolean;
  bottomInset: number;
}

/** The strip sits on the tab bar on tabs and above the safe area elsewhere. */
export function getBannerBottomOffset({
  isTabRoute,
  bottomInset,
}: BannerOffsetInput): number {
  return isTabRoute ? bottomInset + TAB_BAR_HEIGHT : bottomInset;
}

/** Exact match: pushed screens (`/transfers`, `/social/groups/...`) have no tab bar. */
export function isTabRoute(pathname: string): boolean {
  return TAB_ROUTES.includes(pathname.trim());
}

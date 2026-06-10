export function isMobileFullscreenRoute(pathname: string) {
  return pathname.startsWith("/live/") || /^\/games\/[^/]+$/.test(pathname);
}

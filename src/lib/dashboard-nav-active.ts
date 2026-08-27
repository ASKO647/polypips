/** Picks whichever known href is the single best match for the current
 * pathname — an exact match, or otherwise the longest href that pathname
 * falls under. "Longest wins" is what keeps a short parent route (e.g.
 * "/dashboard", which is a startsWith-prefix of literally every other
 * dashboard route) from lighting up alongside whatever more specific page is
 * actually open. Shared by the desktop sidebar and the mobile bottom nav so
 * both apply the exact same rule instead of two independently-maintained
 * (and previously buggy) copies. */
export function findActiveHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (!matches) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}

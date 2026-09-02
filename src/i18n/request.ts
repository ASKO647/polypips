import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * Each entry is one JSON file per locale under messages/<locale>/<name>.json,
 * deep-merged into a single messages object at request time. Split by
 * product surface (marketing, auth, dashboard shell, each dashboard
 * section...) instead of one giant messages/<locale>.json so unrelated
 * areas can be translated independently without touching a shared file.
 * Add a new entry here whenever a new namespace file is introduced.
 */
const MESSAGE_FILES = [
  "marketing",
  "pages",
  "plans",
  "auth",
  "dashboard",
  "polymarket",
  "sport",
  "trading",
  "coach",
  "community",
  "profile",
  "subscription",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const chunks = await Promise.all(
    MESSAGE_FILES.map((name) =>
      import(`../../messages/${locale}/${name}.json`)
        .then((mod) => mod.default)
        .catch(() => null)
    )
  );

  const messages = Object.assign({}, ...chunks.filter(Boolean));

  return { locale, messages };
});

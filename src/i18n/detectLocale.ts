import type { Locale } from "./messages";

/** Pick fi when the browser prefers Finnish; otherwise en (only locales supported). */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of tags) {
    if (tag.toLowerCase().startsWith("fi")) {
      return "fi";
    }
  }

  return "en";
}

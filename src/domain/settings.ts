import { touchHousehold } from "./seed";
import type { Household, Result } from "./types";
import type { Locale } from "@/i18n/messages";

export function updateLocale(
  household: Household,
  locale: Locale,
  now: Date = new Date(),
): Result<Household> {
  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        settings: {
          ...household.settings,
          locale,
        },
      },
      now,
    ),
  };
}

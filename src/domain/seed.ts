import { detectBrowserLocale } from "@/i18n/detectLocale";
import type { Household } from "./types";

export function createEmptyHousehold(
  now: Date = new Date(),
  locale = detectBrowserLocale(),
): Household {
  const iso = now.toISOString();
  return {
    members: [],
    tasks: [],
    completions: [],
    overrides: [],
    rewards: [],
    redemptions: [],
    settings: {
      weekStartsOn: 1,
      locale,
    },
    meta: {
      schemaVersion: 1,
      lastModified: iso,
    },
  };
}

export function touchHousehold(household: Household, now: Date = new Date()): Household {
  return {
    ...household,
    meta: {
      ...household.meta,
      lastModified: now.toISOString(),
    },
  };
}

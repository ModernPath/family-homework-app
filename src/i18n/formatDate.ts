import { format, getISODay } from "date-fns";
import { enUS, fi } from "date-fns/locale";
import type { Locale } from "./messages";
import { getWeekdayOptions } from "./weekdays";

const DATE_LOCALES = {
  en: enUS,
  fi,
} as const;

export function formatTodayHeading(locale: Locale, date = new Date()): string {
  const pattern = locale === "fi" ? "EEEE d.M." : "EEEE, MMM d";
  return format(date, pattern, { locale: DATE_LOCALES[locale] });
}

export function formatWeekColumn(locale: Locale, dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (locale === "fi") {
    const weekday = getWeekdayOptions("fi")[getISODay(date) - 1]!.label;
    return `${weekday} ${format(date, "d.M.")}`;
  }
  return format(date, "EEE M/d", { locale: DATE_LOCALES.en });
}

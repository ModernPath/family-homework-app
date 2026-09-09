import type { Locale, MessageKey } from "./messages";
import { translate } from "./messages";

export const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;

const WEEKDAY_KEYS: MessageKey[] = [
  "weekday.mon",
  "weekday.tue",
  "weekday.wed",
  "weekday.thu",
  "weekday.fri",
  "weekday.sat",
  "weekday.sun",
];

export function getWeekdayOptions(locale: Locale) {
  return WEEKDAY_VALUES.map((value, index) => ({
    value,
    label: translate(locale, WEEKDAY_KEYS[index]!),
  }));
}

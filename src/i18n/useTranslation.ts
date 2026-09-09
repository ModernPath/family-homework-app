import { useCallback, useEffect } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { updateLocale } from "@/domain/settings";
import {
  normalizeLocale,
  translate,
  translateError,
  type Locale,
  type MessageKey,
} from "./messages";

export function useTranslation() {
  const { household, dispatch } = useHousehold();
  const locale = normalizeLocale(household.settings.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const te = useCallback((error: string) => translateError(error, locale), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      void dispatch((h) => updateLocale(h, next));
    },
    [dispatch],
  );

  return { t, te, locale, setLocale };
}

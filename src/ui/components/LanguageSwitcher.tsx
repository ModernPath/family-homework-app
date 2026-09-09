import { LOCALES, type Locale } from "@/i18n/messages";
import { useTranslation } from "@/i18n/useTranslation";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="language-switcher" role="group" aria-label={t("nav.language")}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`language-switcher__btn${locale === code ? " language-switcher__btn--active" : ""}`}
          aria-pressed={locale === code}
          onClick={() => setLocale(code as Locale)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

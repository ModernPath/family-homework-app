import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageSwitcher } from "@/ui/components/LanguageSwitcher";
import { useAuth } from "@/ui/auth/AuthGate";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const auth = useAuth();
  const mainClass =
    pathname.startsWith("/setup") ? "app-main app-main--setup" : "app-main";

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label={t("nav.main")}>
        <NavLink to="/" end>
          {t("nav.today")}
        </NavLink>
        <NavLink to="/week">{t("nav.week")}</NavLink>
        <NavLink to="/coach">{t("nav.coach")}</NavLink>
        <NavLink to="/setup">{t("nav.setup")}</NavLink>
        <LanguageSwitcher />
        {auth ? (
          <button type="button" className="auth-logout" onClick={() => void auth.logout()}>
            {t("auth.logout")}
          </button>
        ) : null}
      </nav>
      <main className={mainClass}>{children}</main>
    </div>
  );
}

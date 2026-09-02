import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();
  const mainClass =
    pathname.startsWith("/setup") ? "app-main app-main--setup" : "app-main";

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Main">
        <NavLink to="/" end>
          Today
        </NavLink>
        <NavLink to="/week">Week</NavLink>
        <NavLink to="/setup">Setup</NavLink>
      </nav>
      <main className={mainClass}>{children}</main>
    </div>
  );
}

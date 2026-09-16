import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthError, getAuthSession, login as loginRequest, logout as logoutRequest } from "@/agent/auth";
import { detectBrowserLocale } from "@/i18n/detectLocale";
import { translate, type Locale } from "@/i18n/messages";

interface AuthContextValue {
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthGateProps {
  children: ReactNode;
  requireAuth?: boolean;
}

function buildRequiresAuth(): boolean {
  if (import.meta.env.VITE_AUTH_REQUIRED === "false") return false;
  return import.meta.env.PROD;
}

export function useAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function AuthGate({ children, requireAuth }: AuthGateProps) {
  const authRequired = requireAuth ?? buildRequiresAuth();
  const locale: Locale = detectBrowserLocale();
  const t = (
    key:
      | "auth.title"
      | "auth.description"
      | "auth.password"
      | "auth.unlock"
      | "auth.checking"
      | "auth.loggingIn"
      | "auth.invalid"
      | "auth.unavailable"
  ) => translate(locale, key);
  const [checked, setChecked] = useState(!authRequired);
  const [authenticated, setAuthenticated] = useState(!authRequired);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"invalid" | "unavailable" | null>(null);

  useEffect(() => {
    if (!authRequired) return;
    void getAuthSession().then(
      (session) => {
        setAuthenticated(session.authenticated && session.auth_required);
        setChecked(true);
        if (!session.auth_required) setError("unavailable");
      },
      () => {
        setError("unavailable");
        setChecked(true);
      },
    );
  }, [authRequired]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      const session = await loginRequest(password);
      if (!session.authenticated || !session.auth_required) {
        throw new AuthError("unavailable");
      }
      setPassword("");
      setAuthenticated(true);
    } catch (caught) {
      setError(caught instanceof AuthError ? caught.code : "unavailable");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setAuthenticated(false);
    }
  }

  if (!checked) {
    return <main className="auth-gate"><p>{t("auth.checking")}</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="auth-gate">
        <section className="auth-card" aria-labelledby="auth-title">
          <h1 id="auth-title">{t("auth.title")}</h1>
          <p>{t("auth.description")}</p>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="family-password">{t("auth.password")}</label>
            <input
              id="family-password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? t("auth.loggingIn") : t("auth.unlock")}
            </button>
          </form>
          {error ? (
            <p className="auth-error" role="alert">
              {t(error === "invalid" ? "auth.invalid" : "auth.unavailable")}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
}

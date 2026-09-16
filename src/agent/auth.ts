import { coachApiBase } from "./homeworkCoach";

export interface AuthSession {
  authenticated: boolean;
  auth_required: boolean;
}

export class AuthError extends Error {
  readonly code: "invalid" | "unavailable";

  constructor(code: "invalid" | "unavailable") {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

async function requestAuth(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${coachApiBase()}/auth/${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new AuthError("unavailable");
  }
}

export async function getAuthSession(): Promise<AuthSession> {
  const response = await requestAuth("session");
  if (!response.ok) throw new AuthError("unavailable");
  return (await response.json()) as AuthSession;
}

export async function login(password: string): Promise<AuthSession> {
  const response = await requestAuth("login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (response.status === 401) throw new AuthError("invalid");
  if (!response.ok) throw new AuthError("unavailable");
  return (await response.json()) as AuthSession;
}

export async function logout(): Promise<void> {
  const response = await requestAuth("logout", { method: "POST" });
  if (!response.ok) throw new AuthError("unavailable");
}

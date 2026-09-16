import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "@/agent/auth";
import { AuthGate } from "@/ui/auth/AuthGate";

const mocks = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/agent/auth", async () => {
  const actual = await vi.importActual<typeof import("@/agent/auth")>("@/agent/auth");
  return { ...actual, ...mocks };
});

describe("AuthGate", () => {
  beforeEach(() => {
    mocks.getAuthSession.mockReset();
    mocks.login.mockReset();
    mocks.logout.mockReset();
  });

  it("shows the password form before rendering household content", async () => {
    mocks.getAuthSession.mockResolvedValue({ authenticated: false, auth_required: true });
    render(
      <AuthGate requireAuth>
        <p>private household</p>
      </AuthGate>,
    );

    await waitFor(() => expect(screen.getByLabelText("Password")).toBeTruthy());
    expect(screen.queryByText("private household")).toBeNull();
  });

  it("unlocks after a successful login", async () => {
    mocks.getAuthSession.mockResolvedValue({ authenticated: false, auth_required: true });
    mocks.login.mockResolvedValue({ authenticated: true, auth_required: true });
    const user = userEvent.setup();
    render(
      <AuthGate requireAuth>
        <p>private household</p>
      </AuthGate>,
    );

    await user.type(await screen.findByLabelText("Password"), "family-secret");
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    expect(await screen.findByText("private household")).toBeTruthy();
  });

  it("shows a generic error for a wrong password", async () => {
    mocks.getAuthSession.mockResolvedValue({ authenticated: false, auth_required: true });
    mocks.login.mockRejectedValue(new AuthError("invalid"));
    const user = userEvent.setup();
    render(<AuthGate requireAuth><p>private household</p></AuthGate>);

    await user.type(await screen.findByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Unlock" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "That password is not correct.",
    );
  });
});

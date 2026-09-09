import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { AppShell } from "@/ui/AppShell";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";

const NOW = new Date("2026-09-02T10:00:00.000Z");

async function renderShell(locale: "en" | "fi") {
  const store = createInMemoryStore();
  await store.save(createEmptyHousehold(NOW, locale));
  render(
    <HouseholdProvider store={store}>
      <MemoryRouter>
        <AppShell>
          <p>content</p>
        </AppShell>
      </MemoryRouter>
    </HouseholdProvider>,
  );
  return store;
}

describe("AppShell language switcher", () => {
  it("switches chrome to Finnish and sets html lang", async () => {
    const user = userEvent.setup();
    const store = await renderShell("en");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Today" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "FI" }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Tänään" })).toBeTruthy();
    });
    expect(screen.getByRole("link", { name: "Viikko" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Valmentaja" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Asetukset" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Päävalikko" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("fi");
    expect((await store.load()).settings.locale).toBe("fi");
  });

  it("switches chrome back to English", async () => {
    const user = userEvent.setup();
    await renderShell("fi");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Tänään" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "EN" }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Today" })).toBeTruthy();
    });
    expect(document.documentElement.lang).toBe("en");
  });
});

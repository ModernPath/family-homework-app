import { afterEach, describe, expect, it, vi } from "vitest";
import { detectBrowserLocale } from "./detectLocale";
import { translate, translateError } from "./messages";
import { formatTodayHeading, formatWeekColumn } from "./formatDate";
import { updateLocale } from "@/domain/settings";
import { createEmptyHousehold } from "@/domain/seed";

describe("i18n", () => {
  it("translates Finnish navigation labels", () => {
    expect(translate("fi", "nav.today")).toBe("Tänään");
    expect(translate("fi", "nav.coach")).toBe("Valmentaja");
    expect(translate("fi", "nav.setup")).toBe("Asetukset");
  });

  it("interpolates parameterized messages", () => {
    expect(
      translate("en", "members.deleteConfirm", { name: "Emma" }),
    ).toBe("Delete Emma? This cannot be undone.");
    expect(
      translate("fi", "members.deleteConfirm", { name: "Emma" }),
    ).toBe("Poistetaanko Emma? Tätä ei voi perua.");
  });

  it("translates known domain errors", () => {
    expect(translateError("Name is required", "fi")).toBe("Nimi on pakollinen");
    expect(translateError("Unknown error", "fi")).toBe("Unknown error");
  });
});

describe("updateLocale", () => {
  it("persists locale in household settings", () => {
    const result = updateLocale(createEmptyHousehold(new Date(), "en"), "fi");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.settings.locale).toBe("fi");
    }
  });
});

describe("detectBrowserLocale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns fi when browser prefers Finnish", () => {
    vi.stubGlobal("navigator", { language: "fi-FI", languages: ["fi-FI", "en"] });
    expect(detectBrowserLocale()).toBe("fi");
  });

  it("returns en for non-Finnish browsers", () => {
    vi.stubGlobal("navigator", { language: "en-US", languages: ["en-US"] });
    expect(detectBrowserLocale()).toBe("en");
  });

  it("uses explicit locale in createEmptyHousehold when provided", () => {
    vi.stubGlobal("navigator", { language: "fi-FI", languages: ["fi-FI"] });
    expect(createEmptyHousehold(new Date(), "en").settings.locale).toBe("en");
  });

  it("seeds fi from the browser when locale is omitted", () => {
    vi.stubGlobal("navigator", { language: "fi-FI", languages: ["fi-FI"] });
    expect(createEmptyHousehold(new Date()).settings.locale).toBe("fi");
  });
});

describe("formatDate", () => {
  const date = new Date(2026, 8, 2, 12, 0, 0);

  it("formats the English today heading", () => {
    expect(formatTodayHeading("en", date)).toBe("Wednesday, Sep 2");
  });

  it("formats the Finnish today heading with day.month", () => {
    expect(formatTodayHeading("fi", date)).toBe("keskiviikkona 2.9.");
  });

  it("formats the English week column", () => {
    expect(formatWeekColumn("en", "2026-09-02")).toBe("Wed 9/2");
  });

  it("formats the Finnish week column with day.month", () => {
    expect(formatWeekColumn("fi", "2026-09-02")).toBe("Ke 2.9.");
  });
});

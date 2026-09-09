import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "@/domain/seed";
import {
  backupHasRequiredKeys,
  exportFilename,
  getBackupPreview,
  parseBackup,
  serializeHousehold,
} from "./exportImport";

const NOW = new Date("2026-09-02T10:00:00.000Z");

describe("exportImport", () => {
  it("uses exact backup filename", () => {
    expect(exportFilename()).toBe("family-task-board-backup.json");
  });

  it("serializes required top-level keys", () => {
    const h = createEmptyHousehold(NOW);
    expect(backupHasRequiredKeys(h)).toBe(true);
  });

  it("round-trips household through JSON", () => {
    const h = createEmptyHousehold(NOW);
    const parsed = parseBackup(serializeHousehold(h));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.members).toEqual(h.members);
    expect(parsed.value.settings).toEqual(h.settings);
  });

  it("rejects invalid backup file", () => {
    expect(parseBackup(JSON.stringify({ foo: 1 }))).toEqual({
      ok: false,
      error: "Invalid backup file",
    });
  });

  it("returns member and task counts for preview", () => {
    const h = createEmptyHousehold(NOW);
    h.members.push({
      id: "m1",
      name: "Emma",
      color: "#3B82F6",
      avatar: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
    h.tasks.push({
      id: "t1",
      title: "Dishes",
      icon: "🍽️",
      schedule: { type: "daily" },
      assignment: { type: "pool" },
      points: 10,
      active: true,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });

    expect(getBackupPreview(h)).toEqual({ memberCount: 1, taskCount: 1 });
  });

  it("keeps Finnish locale on import", () => {
    const h = createEmptyHousehold(NOW, "fi");
    const parsed = parseBackup(serializeHousehold(h));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.settings.locale).toBe("fi");
  });

  it("normalizes unknown import locale to en", () => {
    const h = createEmptyHousehold(NOW, "en");
    const raw = JSON.parse(serializeHousehold(h)) as { settings: { locale: string } };
    raw.settings.locale = "sv";
    const parsed = parseBackup(JSON.stringify(raw));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.settings.locale).toBe("en");
  });
});

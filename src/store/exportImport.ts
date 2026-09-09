import type { Household } from "@/domain/types";
import { normalizeLocale } from "@/i18n/messages";
import { BACKUP_FILENAME } from "./store";

const REQUIRED_KEYS = [
  "members",
  "tasks",
  "completions",
  "rewards",
  "redemptions",
  "overrides",
  "settings",
  "meta",
] as const;

export function serializeHousehold(household: Household): string {
  return JSON.stringify(household, null, 2);
}

export function validateBackup(data: unknown): data is Household {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const record = data as Record<string, unknown>;
  if (record.meta === undefined || typeof record.meta !== "object") {
    return false;
  }

  const meta = record.meta as Record<string, unknown>;
  if (meta.schemaVersion !== 1) {
    return false;
  }

  return REQUIRED_KEYS.every((key) => key in record);
}

export function parseBackup(json: string): { ok: true; value: Household } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid backup file" };
  }

  if (!validateBackup(parsed)) {
    return { ok: false, error: "Invalid backup file" };
  }

  const household = parsed as Household;
  return {
    ok: true,
    value: {
      ...household,
      settings: {
        ...household.settings,
        locale: normalizeLocale(household.settings?.locale),
      },
    },
  };
}

export function exportFilename(): string {
  return BACKUP_FILENAME;
}

export function getBackupPreview(household: Household): {
  memberCount: number;
  taskCount: number;
} {
  return {
    memberCount: household.members.length,
    taskCount: household.tasks.length,
  };
}

export function backupHasRequiredKeys(household: Household): boolean {
  const parsed = JSON.parse(serializeHousehold(household)) as Record<string, unknown>;
  return REQUIRED_KEYS.every((key) => key in parsed);
}

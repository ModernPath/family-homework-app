import type { Household } from "@/domain/types";

export interface Store {
  load(): Promise<Household>;
  save(household: Household): Promise<void>;
  subscribe(listener: (household: Household) => void): () => void;
}

export const BACKUP_FILENAME = "family-task-board-backup.json";

export const IMPORT_CONFIRM_MESSAGE = "Replace all data? This cannot be undone.";

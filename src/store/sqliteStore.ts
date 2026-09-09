import initSqlJs from "sql.js";
import { createEmptyHousehold } from "@/domain/seed";
import type { Household } from "@/domain/types";
import { parseBackup, serializeHousehold } from "./exportImport";
import type { ByteStore } from "./byteStore";
import type { Store } from "./store";

const ROW_ID = "default";

const SCHEMA = `CREATE TABLE IF NOT EXISTS household (
  id TEXT PRIMARY KEY,
  document TEXT NOT NULL
)`;

type SqlJsDatabase = {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  export(): Uint8Array;
  close(): void;
};

type SqlJsStatic = {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
};

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

async function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    const config =
      typeof document === "undefined"
        ? undefined
        : { locateFile: (file: string) => `/${file}` };
    sqlJsPromise = initSqlJs(config) as Promise<SqlJsStatic>;
  }
  return sqlJsPromise;
}

function readDocument(db: SqlJsDatabase): Household | null {
  const result = db.exec(`SELECT document FROM household WHERE id = '${ROW_ID}'`);
  const json = result[0]?.values[0]?.[0];
  if (typeof json !== "string") return null;
  const parsed = parseBackup(json);
  return parsed.ok ? parsed.value : null;
}

function writeDocument(db: SqlJsDatabase, household: Household): void {
  db.run(SCHEMA);
  db.run("INSERT OR REPLACE INTO household (id, document) VALUES (?, ?)", [
    ROW_ID,
    serializeHousehold(household),
  ]);
}

function openDatabase(SQL: SqlJsStatic, bytes: Uint8Array | null): SqlJsDatabase | null {
  try {
    const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    db.run(SCHEMA);
    return db;
  } catch {
    return null;
  }
}

export interface SqliteStoreOptions {
  persist: ByteStore;
  migrateFrom?: () => Promise<Household | null>;
}

export function createSqliteStore(options: SqliteStoreOptions): Store {
  const listeners = new Set<(h: Household) => void>();
  let writeChain = Promise.resolve();

  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const next = writeChain.then(work, work);
    writeChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  return {
    load() {
      return enqueue(async () => {
        const SQL = await loadSqlJs();
        const bytes = await options.persist.read();
        if (bytes === null) {
          const migrated = (await options.migrateFrom?.()) ?? null;
          if (migrated) {
            const db = openDatabase(SQL, null);
            if (!db) return createEmptyHousehold();
            writeDocument(db, migrated);
            await options.persist.write(db.export());
            db.close();
            return migrated;
          }
          return createEmptyHousehold();
        }

        const db = openDatabase(SQL, bytes);
        if (!db) return createEmptyHousehold();
        const household = readDocument(db) ?? createEmptyHousehold();
        db.close();
        return household;
      });
    },
    save(household) {
      return enqueue(async () => {
        const SQL = await loadSqlJs();
        const bytes = await options.persist.read();
        const db = openDatabase(SQL, bytes) ?? openDatabase(SQL, null);
        if (!db) return;
        writeDocument(db, household);
        await options.persist.write(db.export());
        db.close();
        listeners.forEach((listener) => listener(household));
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

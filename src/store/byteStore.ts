export const SQLITE_FILENAME = "family-task-board.sqlite";

export interface ByteStore {
  read(): Promise<Uint8Array | null>;
  write(bytes: Uint8Array): Promise<void>;
}

export function createMemoryByteStore(initial?: Uint8Array): ByteStore {
  let data: Uint8Array | null = initial ? new Uint8Array(initial) : null;
  return {
    async read() {
      return data ? new Uint8Array(data) : null;
    },
    async write(bytes) {
      data = new Uint8Array(bytes);
    },
  };
}

export function createOpfsByteStore(filename = SQLITE_FILENAME): ByteStore {
  async function rootDir() {
    if (!navigator.storage?.getDirectory) {
      throw new Error("OPFS is not available");
    }
    return navigator.storage.getDirectory();
  }

  return {
    async read() {
      try {
        const dir = await rootDir();
        const handle = await dir.getFileHandle(filename);
        const file = await handle.getFile();
        if (file.size === 0) return null;
        return new Uint8Array(await file.arrayBuffer());
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          return null;
        }
        throw error;
      }
    },
    async write(bytes) {
      const dir = await rootDir();
      const handle = await dir.getFileHandle(filename, { create: true });
      const writable = await handle.createWritable();
      await writable.write(bytes);
      await writable.close();
    },
  };
}

export function canUseOpfs(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
}

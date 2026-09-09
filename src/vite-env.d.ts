/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOMEWORK_COACH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "sql.js" {
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<unknown>;
}

declare module "*.ts?raw" {
  const content: string;
  export default content;
}

import { useRef, useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import {
  exportFilename,
  getBackupPreview,
  parseBackup,
  serializeHousehold,
} from "@/store/exportImport";
import { IMPORT_CONFIRM_MESSAGE } from "@/store/store";
import type { Household } from "@/domain/types";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";
import { createVuorioHousehold } from "@/domain/demoHousehold";

export function BackupPanel() {
  const { household, dispatch } = useHousehold();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Household | null>(null);
  const [pendingSample, setPendingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const preview = pendingImport ? getBackupPreview(pendingImport) : null;
  const sampleHousehold = pendingSample ? createVuorioHousehold() : null;
  const samplePreview = sampleHousehold ? getBackupPreview(sampleHousehold) : null;

  return (
    <div className="setup-panel">
      <p className="subsection-label">Data backup</p>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
        Export your household data to a file, or restore from a previous backup.
      </p>

      <div className="backup-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const blob = new Blob([serializeHousehold(household)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = exportFilename();
            anchor.click();
            URL.revokeObjectURL(url);
            setMessage("Backup downloaded");
          }}
        >
          Export backup
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const text = String(reader.result);
              const parsed = parseBackup(text);
              if (!parsed.ok) {
                setError(parsed.error);
                return;
              }
              setPendingImport(parsed.value);
              setError(null);
            };
            reader.readAsText(file);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Import backup
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setPendingSample(true);
            setError(null);
          }}
        >
          Load Vuorio family sample
        </button>
      </div>

      {pendingImport && preview && (
        <ConfirmDialog
          preview={
            <p className="dialog-preview">
              This backup has {preview.memberCount} member
              {preview.memberCount === 1 ? "" : "s"} and {preview.taskCount} task
              {preview.taskCount === 1 ? "" : "s"}.
            </p>
          }
          message={IMPORT_CONFIRM_MESSAGE}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            void dispatch(() => ({ ok: true, value: pendingImport }));
            setPendingImport(null);
            setMessage("Import complete");
          }}
        />
      )}

      {pendingSample && sampleHousehold && samplePreview && (
        <ConfirmDialog
          preview={
            <>
              <p className="dialog-preview">
                Loads Pasi, Minna, Sini, Saara, Miska with {samplePreview.taskCount}{" "}
                chores and sample rewards.
              </p>
              <p className="dialog-preview">
                This backup has {samplePreview.memberCount} members and{" "}
                {samplePreview.taskCount} tasks.
              </p>
            </>
          }
          message={IMPORT_CONFIRM_MESSAGE}
          onCancel={() => setPendingSample(false)}
          onConfirm={() => {
            void dispatch(() => ({ ok: true, value: sampleHousehold }));
            setPendingSample(false);
            setMessage("Vuorio family sample loaded");
          }}
        />
      )}

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

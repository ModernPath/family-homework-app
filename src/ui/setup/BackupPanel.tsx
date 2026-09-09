import { useRef, useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { useTranslation } from "@/i18n/useTranslation";
import {
  exportFilename,
  getBackupPreview,
  parseBackup,
  serializeHousehold,
} from "@/store/exportImport";
import type { Household } from "@/domain/types";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";
import { createVuorioHousehold } from "@/domain/demoHousehold";

export function BackupPanel() {
  const { household, dispatch } = useHousehold();
  const { t, te } = useTranslation();
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
      <p className="subsection-label">{t("backup.title")}</p>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
        {t("backup.description")}
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
            setMessage(t("backup.downloaded"));
          }}
        >
          {t("backup.export")}
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
                setError(te(parsed.error));
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
          {t("backup.import")}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setPendingSample(true);
            setError(null);
          }}
        >
          {t("backup.loadSample")}
        </button>
      </div>

      {pendingImport && preview && (
        <ConfirmDialog
          preview={
            <p className="dialog-preview">
              {t("backup.previewCounts", {
                members: preview.memberCount,
                tasks: preview.taskCount,
              })}
            </p>
          }
          message={t("backup.importConfirm")}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            void dispatch(() => ({ ok: true, value: pendingImport }));
            setPendingImport(null);
            setMessage(t("backup.importComplete"));
          }}
        />
      )}

      {pendingSample && sampleHousehold && samplePreview && (
        <ConfirmDialog
          preview={
            <>
              <p className="dialog-preview">
                {t("backup.samplePreview", { tasks: samplePreview.taskCount })}
              </p>
              <p className="dialog-preview">
                {t("backup.previewCounts", {
                  members: samplePreview.memberCount,
                  tasks: samplePreview.taskCount,
                })}
              </p>
            </>
          }
          message={t("backup.importConfirm")}
          onCancel={() => setPendingSample(false)}
          onConfirm={() => {
            void dispatch(() => ({ ok: true, value: sampleHousehold }));
            setPendingSample(false);
            setMessage(t("backup.sampleLoaded"));
          }}
        />
      )}

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

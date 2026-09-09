import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface ConfirmDialogProps {
  message: string;
  preview?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function ConfirmDialog({
  message,
  preview,
  onCancel,
  onConfirm,
  confirmLabel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        {preview}
        <p>{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

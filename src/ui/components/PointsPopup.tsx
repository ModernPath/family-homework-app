import { useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./PointsPopup.module.css";

interface PointsPopupProps {
  points: number;
  onDone: () => void;
}

export function PointsPopup({ points, onDone }: PointsPopupProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = window.setTimeout(onDone, 800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.popup} aria-live="polite">
      +{points} {t("common.pts")}
    </div>
  );
}

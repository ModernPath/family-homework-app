import { useEffect } from "react";
import styles from "./PointsPopup.module.css";

interface PointsPopupProps {
  points: number;
  onDone: () => void;
}

export function PointsPopup({ points, onDone }: PointsPopupProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.popup} aria-live="polite">
      +{points} pts
    </div>
  );
}

import type { Task } from "@/domain/types";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  checked: boolean;
  onTap: () => void;
}

export function TaskCard({ task, checked, onTap }: TaskCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card}${checked ? ` ${styles.cardChecked}` : ""}`}
      role="checkbox"
      aria-checked={checked}
      aria-label={task.title}
      onClick={onTap}
    >
      <span className={styles.check}>{checked ? "✓" : "☐"}</span>
      <span className={styles.icon}>{task.icon}</span>
      <span className={styles.title}>{task.title}</span>
    </button>
  );
}

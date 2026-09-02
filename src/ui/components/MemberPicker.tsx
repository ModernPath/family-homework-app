import type { Member } from "@/domain/types";
import { MemberBadge } from "@/ui/components/MemberBadge";
import styles from "./MemberPicker.module.css";

interface MemberPickerProps {
  members: Member[];
  onSelect: (memberId: string) => void;
  onCancel: () => void;
}

export function MemberPicker({ members, onSelect, onCancel }: MemberPickerProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Choose member">
        <p className={styles.title}>Who did it?</p>
        <ul className={styles.list}>
          {[...members]
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => onSelect(member.id)}
                >
                  <MemberBadge member={member} dotClassName={styles.dot} />
                </button>
              </li>
            ))}
        </ul>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

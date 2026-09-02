import styles from "./EmojiPicker.module.css";

const EMOJIS = [
  "🍽️", "🗑️", "🛋️", "🧹", "🛏️", "🐱", "🐶", "🌱",
  "👕", "🚗", "📚", "🎸", "⚽", "🎨", "🍳", "🪴",
  "🧺", "🚿", "🪥", "🧸", "🎮", "📦", "🎁", "⭐",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className={`${styles.grid} picker-grid`} role="listbox" aria-label="Choose an icon">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="option"
          aria-selected={value === emoji}
          className={styles.cell}
          onClick={() => onChange(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { EMOJIS };

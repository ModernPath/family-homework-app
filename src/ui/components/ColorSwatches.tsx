import { MEMBER_COLOR_PALETTE } from "@/domain/types";

interface ColorSwatchesProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  return (
    <div className="color-swatches" role="radiogroup" aria-label="Color">
      {MEMBER_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className="color-swatch"
          style={{ backgroundColor: color }}
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

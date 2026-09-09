import { MEMBER_COLOR_PALETTE } from "@/domain/types";
import { useTranslation } from "@/i18n/useTranslation";

interface ColorSwatchesProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  const { t } = useTranslation();
  return (
    <div className="color-swatches" role="radiogroup" aria-label={t("members.color")}>
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

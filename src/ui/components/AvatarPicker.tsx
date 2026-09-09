import { useEffect, useState } from "react";
import {
  HUMAN_AVATAR_BASES,
  OTHER_AVATARS,
  PET_AVATARS,
  ROBOT_AVATARS,
  SKIN_TONES,
  applySkinTone,
  buildAvatar,
  parseAvatar,
  skinToneById,
  type SkinToneId,
} from "@/domain/avatarTone";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./EmojiPicker.module.css";

interface AvatarPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function OtherAvatarGrid({
  labelId,
  label,
  options,
  otherId,
  onSelect,
}: {
  labelId: string;
  label: string;
  options: readonly { id: string; emoji: string; label: string }[];
  otherId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="form-field" style={{ marginBottom: 12 }}>
      <span id={labelId}>{label}</span>
      <div className={`${styles.grid} picker-grid`} role="listbox" aria-labelledby={labelId}>
        {options.map(({ id, emoji, label: optionLabel }) => (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={otherId === id}
            aria-label={optionLabel}
            title={optionLabel}
            className={styles.cell}
            onClick={() => onSelect(id)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { t } = useTranslation();
  const parsed = parseAvatar(value || null);
  const [skinToneId, setSkinToneId] = useState<SkinToneId>(parsed.skinToneId);
  const [humanBaseId, setHumanBaseId] = useState<string | null>(parsed.humanBaseId);
  const [otherId, setOtherId] = useState<string | null>(parsed.otherId);

  useEffect(() => {
    const next = parseAvatar(value || null);
    setSkinToneId(next.skinToneId);
    setHumanBaseId(next.humanBaseId);
    setOtherId(next.otherId);
  }, [value]);

  const toneModifier = skinToneById(skinToneId);

  function selectSkinTone(id: SkinToneId) {
    setSkinToneId(id);
    setOtherId(null);
    if (humanBaseId) {
      const base = HUMAN_AVATAR_BASES.find((h) => h.id === humanBaseId)!.base;
      onChange(buildAvatar(base, skinToneById(id)));
    }
  }

  function selectHuman(id: string) {
    setHumanBaseId(id);
    setOtherId(null);
    const base = HUMAN_AVATAR_BASES.find((h) => h.id === id)!.base;
    onChange(buildAvatar(base, toneModifier));
  }

  function selectOther(id: string) {
    setOtherId(id);
    setHumanBaseId(null);
    onChange(OTHER_AVATARS.find((o) => o.id === id)!.emoji);
  }

  return (
    <div className="avatar-picker">
      <div className="form-field" style={{ marginBottom: 12 }}>
        <span id="avatar-skin-label">{t("avatar.skinTone")}</span>
        <div
          className="skin-tone-swatches"
          role="radiogroup"
          aria-labelledby="avatar-skin-label"
        >
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              className="skin-tone-swatch"
              style={{ backgroundColor: tone.swatch }}
              role="radio"
              aria-checked={skinToneId === tone.id}
              aria-label={tone.label}
              onClick={() => selectSkinTone(tone.id)}
            />
          ))}
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <span id="avatar-style-label">{t("avatar.style")}</span>
        <div
          className={`${styles.grid} picker-grid`}
          role="listbox"
          aria-labelledby="avatar-style-label"
          aria-label={t("avatar.choose")}
        >
          {HUMAN_AVATAR_BASES.map(({ id, base, label }) => {
            const rendered = applySkinTone(base, toneModifier);
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={humanBaseId === id && !otherId}
                aria-label={label}
                title={label}
                className={styles.cell}
                onClick={() => selectHuman(id)}
              >
                {rendered}
              </button>
            );
          })}
        </div>
      </div>

      <OtherAvatarGrid
        labelId="avatar-pets-label"
        label={t("avatar.pets")}
        options={PET_AVATARS}
        otherId={otherId}
        onSelect={selectOther}
      />

      <OtherAvatarGrid
        labelId="avatar-robots-label"
        label={t("avatar.robots")}
        options={ROBOT_AVATARS}
        otherId={otherId}
        onSelect={selectOther}
      />
    </div>
  );
}

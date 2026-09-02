/** Fitzpatrick emoji skin tone modifiers (appended to tone-capable bases). */
export const SKIN_TONES = [
  { id: "light", modifier: "\u{1F3FB}", swatch: "#F7E7CE", label: "Light" },
  { id: "medium-light", modifier: "\u{1F3FC}", swatch: "#E8B88A", label: "Medium light" },
  { id: "medium", modifier: "\u{1F3FD}", swatch: "#C68642", label: "Medium" },
  { id: "medium-dark", modifier: "\u{1F3FE}", swatch: "#8D5524", label: "Medium dark" },
  { id: "dark", modifier: "\u{1F3FF}", swatch: "#4A2912", label: "Dark" },
] as const;

export type SkinToneId = (typeof SKIN_TONES)[number]["id"];

export const DEFAULT_SKIN_TONE_ID: SkinToneId = "medium-light";

export const HUMAN_AVATAR_BASES = [
  { id: "woman", base: "👩", label: "Woman" },
  { id: "man", base: "👨", label: "Man" },
  { id: "person", base: "🧑", label: "Person" },
  { id: "girl", base: "👧", label: "Girl" },
  { id: "boy", base: "👦", label: "Boy" },
  { id: "child", base: "🧒", label: "Child" },
  { id: "baby", base: "👶", label: "Baby" },
  { id: "older-man", base: "👴", label: "Older man" },
  { id: "older-woman", base: "👵", label: "Older woman" },
  { id: "blond", base: "👱", label: "Blond" },
  { id: "blond-woman", base: "👱‍♀️", label: "Blond woman" },
  { id: "blond-man", base: "👱‍♂️", label: "Blond man" },
  { id: "beard", base: "🧔", label: "Beard" },
  { id: "headscarf", base: "🧕", label: "Woman with headscarf" },
  { id: "skullcap", base: "👲", label: "Person with skullcap" },
] as const;

export const PET_AVATARS = [
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "rabbit", emoji: "🐰", label: "Rabbit" },
  { id: "hamster", emoji: "🐹", label: "Hamster" },
  { id: "bear", emoji: "🐻", label: "Bear" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "frog", emoji: "🐸", label: "Frog" },
  { id: "turtle", emoji: "🐢", label: "Turtle" },
  { id: "parrot", emoji: "🦜", label: "Parrot" },
  { id: "penguin", emoji: "🐧", label: "Penguin" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn" },
  { id: "teddy", emoji: "🧸", label: "Teddy bear" },
] as const;

export const ROBOT_AVATARS = [
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "alien", emoji: "👾", label: "Alien" },
  { id: "rocket", emoji: "🚀", label: "Rocket" },
] as const;

export const OTHER_AVATARS = [...PET_AVATARS, ...ROBOT_AVATARS] as const;

const ZWJ = "\u200D";
const ALL_MODIFIERS = SKIN_TONES.map((t) => t.modifier);

export function skinToneById(id: SkinToneId): string {
  return SKIN_TONES.find((t) => t.id === id)!.modifier;
}

export function applySkinTone(base: string, modifier: string): string {
  if (!modifier) return base;
  const zwjIndex = base.indexOf(ZWJ);
  if (zwjIndex === -1) return base + modifier;
  return base.slice(0, zwjIndex) + modifier + base.slice(zwjIndex);
}

export function buildAvatar(base: string, toneModifier: string): string {
  return applySkinTone(base, toneModifier);
}

export function parseAvatar(value: string | null): {
  skinToneId: SkinToneId;
  humanBaseId: string | null;
  otherId: string | null;
} {
  if (!value) {
    return { skinToneId: DEFAULT_SKIN_TONE_ID, humanBaseId: null, otherId: null };
  }

  const other = OTHER_AVATARS.find((o) => o.emoji === value);
  if (other) {
    return { skinToneId: DEFAULT_SKIN_TONE_ID, humanBaseId: null, otherId: other.id };
  }

  let toneModifier = "";
  let stripped = value;
  for (const mod of ALL_MODIFIERS) {
    if (value.includes(mod)) {
      toneModifier = mod;
      stripped = value.replace(mod, "");
      break;
    }
  }

  const toneEntry =
    SKIN_TONES.find((t) => t.modifier === toneModifier) ??
    SKIN_TONES.find((t) => t.id === DEFAULT_SKIN_TONE_ID)!;

  const human = HUMAN_AVATAR_BASES.find((h) => h.base === stripped);
  if (human) {
    return { skinToneId: toneEntry.id, humanBaseId: human.id, otherId: null };
  }

  return { skinToneId: DEFAULT_SKIN_TONE_ID, humanBaseId: null, otherId: null };
}

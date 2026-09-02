import { describe, expect, it } from "vitest";
import {
  applySkinTone,
  buildAvatar,
  parseAvatar,
  skinToneById,
} from "./avatarTone";

describe("applySkinTone", () => {
  it("appends modifier to simple emoji", () => {
    expect(applySkinTone("👨", skinToneById("medium"))).toBe("👨🏽");
  });

  it("inserts modifier before ZWJ sequences", () => {
    expect(applySkinTone("👱‍♀️", skinToneById("light"))).toBe("👱🏻‍♀️");
  });
});

describe("parseAvatar", () => {
  it("round-trips human avatar with tone", () => {
    const avatar = buildAvatar("👧", skinToneById("dark"));
    const parsed = parseAvatar(avatar);
    expect(parsed.humanBaseId).toBe("girl");
    expect(parsed.skinToneId).toBe("dark");
  });

  it("recognizes other avatars", () => {
    expect(parseAvatar("🐱").otherId).toBe("cat");
    expect(parseAvatar("🤖").otherId).toBe("robot");
  });
});

import { describe, expect, it } from "vitest";
import { createEmptyHousehold } from "./seed";
import {
  addReward,
  formatDeactivateRewardMessage,
  formatRedeemConfirmMessage,
  getActiveRewards,
  redeemReward,
  validateRewardCost,
} from "./rewards";
import { allTimePoints } from "./points";
import type { Household } from "./types";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = "2026-09-02";

function memberHousehold(points: number): Household {
  const h = createEmptyHousehold(NOW);
  return {
    ...h,
    members: [
      {
        id: "m1",
        name: "Emma",
        color: "#3B82F6",
        avatar: null,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    ],
    completions: [
      {
        id: "c1",
        taskId: "t1",
        memberId: "m1",
        date: DATE,
        points,
        createdAt: NOW.toISOString(),
      },
    ],
  };
}

describe("validateRewardCost", () => {
  it("rejects zero cost", () => {
    expect(validateRewardCost(0)).toEqual({
      valid: false,
      error: "Cost must be at least 1 point",
    });
  });
});

describe("addReward", () => {
  it("creates active reward", () => {
    const h = createEmptyHousehold(NOW);
    const result = addReward(h, { title: "Movie night", cost: 50 }, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const reward = result.value.rewards[0]!;
    expect(reward.title).toBe("Movie night");
    expect(reward.cost).toBe(50);
    expect(reward.active).toBe(true);
    expect(reward.id).toBeTruthy();
  });
});

describe("getActiveRewards", () => {
  it("filters inactive rewards", () => {
    const h = createEmptyHousehold(NOW);
    const withRewards = addReward(h, { title: "Movie night", cost: 50 }, NOW);
    if (!withRewards.ok) throw new Error(withRewards.error);
    const inactive = addReward(
      withRewards.value,
      { title: "Ice cream", cost: 20 },
      NOW,
    );
    if (!inactive.ok) throw new Error(inactive.error);
    const iceId = inactive.value.rewards.find((r) => r.title === "Ice cream")!.id;
    const deactivated = {
      ...inactive.value,
      rewards: inactive.value.rewards.map((r) =>
        r.id === iceId ? { ...r, active: false } : r,
      ),
    };

    expect(getActiveRewards(deactivated)).toHaveLength(1);
    expect(getActiveRewards(deactivated)[0]!.title).toBe("Movie night");
  });

  it("formats deactivate message", () => {
    expect(formatDeactivateRewardMessage("Movie night")).toBe(
      'Deactivate "Movie night"? It will no longer appear in the rewards list.',
    );
  });
});

describe("redeemReward", () => {
  it("creates redemption and deducts points", () => {
    const h = memberHousehold(60);
    const withReward = addReward(h, { title: "Movie night", cost: 50 }, NOW);
    if (!withReward.ok) throw new Error(withReward.error);
    const rewardId = withReward.value.rewards[0]!.id;

    const result = redeemReward(withReward.value, rewardId, "m1", DATE, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.redemptions[0]!.pointsSpent).toBe(50);
    expect(allTimePoints(result.value, "m1")).toBe(10);
  });

  it("blocks insufficient points", () => {
    const h = memberHousehold(40);
    const withReward = addReward(h, { title: "Movie night", cost: 50 }, NOW);
    if (!withReward.ok) throw new Error(withReward.error);
    const rewardId = withReward.value.rewards[0]!.id;

    const result = redeemReward(withReward.value, rewardId, "m1", DATE, NOW);

    expect(result).toEqual({ ok: false, error: "Not enough points" });
    expect(withReward.value.redemptions).toHaveLength(0);
  });
});

describe("formatRedeemConfirmMessage", () => {
  it("uses exact confirm dialog copy", () => {
    expect(formatRedeemConfirmMessage("Movie night", "Emma", 50)).toBe(
      'Redeem "Movie night" for Emma? Costs 50 pts.',
    );
  });
});

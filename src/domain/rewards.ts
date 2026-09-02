import { touchHousehold } from "./seed";
import { allTimePoints } from "./points";
import type { Household, Result, Reward } from "./types";

export interface AddRewardInput {
  title: string;
  cost: number;
}

export function validateRewardCost(
  cost: number,
): { valid: true } | { valid: false; error: string } {
  if (cost < 1) {
    return { valid: false, error: "Cost must be at least 1 point" };
  }
  return { valid: true };
}

export function addReward(
  household: Household,
  input: AddRewardInput,
  now: Date = new Date(),
): Result<Household> {
  const costCheck = validateRewardCost(input.cost);
  if (!costCheck.valid) {
    return { ok: false, error: costCheck.error };
  }

  const iso = now.toISOString();
  const reward: Reward = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    cost: input.cost,
    active: true,
    createdAt: iso,
    updatedAt: iso,
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        rewards: [...household.rewards, reward],
      },
      now,
    ),
  };
}

export function getActiveRewards(household: Household): Reward[] {
  return household.rewards.filter((r) => r.active);
}

export function formatRewardRow(reward: Reward): string {
  return `${reward.title} — ${reward.cost} pts`;
}

export function formatRedeemConfirmMessage(
  title: string,
  memberName: string,
  cost: number,
): string {
  return `Redeem "${title}" for ${memberName}? Costs ${cost} pts.`;
}

export function formatDeactivateRewardMessage(title: string): string {
  return `Deactivate "${title}"? It will no longer appear in the rewards list.`;
}

export function deactivateReward(
  household: Household,
  rewardId: string,
  now: Date = new Date(),
): Result<Household> {
  const index = household.rewards.findIndex((r) => r.id === rewardId);
  if (index === -1) {
    return { ok: false, error: "Reward not found" };
  }

  const rewards = [...household.rewards];
  rewards[index] = {
    ...rewards[index]!,
    active: false,
    updatedAt: now.toISOString(),
  };

  return {
    ok: true,
    value: touchHousehold({ ...household, rewards }, now),
  };
}

export function redeemReward(
  household: Household,
  rewardId: string,
  memberId: string,
  date: string,
  now: Date = new Date(),
): Result<Household> {
  const reward = household.rewards.find((r) => r.id === rewardId);
  if (!reward || !reward.active) {
    return { ok: false, error: "Reward not found" };
  }

  const member = household.members.find((m) => m.id === memberId);
  if (!member) {
    return { ok: false, error: "Member not found" };
  }

  if (allTimePoints(household, memberId) < reward.cost) {
    return { ok: false, error: "Not enough points" };
  }

  const redemption = {
    id: crypto.randomUUID(),
    rewardId,
    memberId,
    date,
    pointsSpent: reward.cost,
    createdAt: now.toISOString(),
  };

  return {
    ok: true,
    value: touchHousehold(
      {
        ...household,
        redemptions: [...household.redemptions, redemption],
      },
      now,
    ),
  };
}

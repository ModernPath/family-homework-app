import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { RewardsPanel } from "@/ui/setup/RewardsPanel";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addReward, formatDeactivateRewardMessage } from "@/domain/rewards";

const NOW = new Date("2026-09-02T10:00:00.000Z");

async function seedRewardStore() {
  const store = createInMemoryStore();
  let h = createEmptyHousehold(NOW);
  const member = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
  if (!member.ok) throw new Error(member.error);
  h = member.value;
  const reward = addReward(h, { title: "Movie night", cost: 50 }, NOW);
  if (!reward.ok) throw new Error(reward.error);
  await store.save(reward.value);
  return store;
}

describe("RewardsPanel", () => {
  it("requires confirmation before deactivating a reward", async () => {
    const user = userEvent.setup();
    const store = await seedRewardStore();

    render(
      <HouseholdProvider store={store}>
        <RewardsPanel />
      </HouseholdProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Deactivate" }));
    expect(screen.getByText(formatDeactivateRewardMessage("Movie night"))).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect((await store.load()).rewards[0]!.active).toBe(true);

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(async () => {
      expect((await store.load()).rewards[0]!.active).toBe(false);
    });
  });
});

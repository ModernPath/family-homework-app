import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { WeekView } from "@/ui/week/WeekView";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask } from "@/domain/tasks";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = format(NOW, "yyyy-MM-dd");

async function seedWeekStore() {
  const store = createInMemoryStore();
  let h = createEmptyHousehold(NOW);
  const m1 = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
  const m2 = addMember(m1.ok ? m1.value : h, { name: "Dad", color: "#22C55E" }, NOW);
  if (!m1.ok || !m2.ok) throw new Error("members");
  h = m2.value;
  const task = addTask(
    h,
    {
      title: "Dishes",
      icon: "🍽️",
      schedule: { type: "once", date: DATE },
      assignment: { type: "rotation", memberIds: [h.members[0]!.id, h.members[1]!.id] },
    },
    NOW,
  );
  if (!task.ok) throw new Error(task.error);
  await store.save(task.value);
  return { store, taskId: task.value.tasks[0]!.id, m2Id: h.members[1]!.id };
}

describe("WeekView", () => {
  it("saves override when assignee cell is changed", async () => {
    const user = userEvent.setup();
    const { store, m2Id } = await seedWeekStore();

    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <WeekView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Emma/i })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: /Emma/i }));
    await user.click(screen.getByRole("button", { name: "Dad" }));

    const loaded = await store.load();
    expect(loaded.overrides).toHaveLength(1);
    expect(loaded.overrides[0]!.memberId).toBe(m2Id);
  });
});

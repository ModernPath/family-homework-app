import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { TodayView } from "@/ui/today/TodayView";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask } from "@/domain/tasks";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = format(NOW, "yyyy-MM-dd");

async function seedTodayStore() {
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
      points: 10,
    },
    NOW,
  );
  if (!task.ok) throw new Error(task.error);
  await store.save(task.value);
  return store;
}

describe("TodayView", () => {
  it("completes a rotation task and shows points popup", async () => {
    const user = userEvent.setup();
    const store = await seedTodayStore();

    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <TodayView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Dishes" })).toBeTruthy();
    });

    await user.click(screen.getByRole("checkbox", { name: "Dishes" }));

    await waitFor(() => {
      expect(screen.getByText("+10 pts")).toBeTruthy();
    });

    const loaded = await store.load();
    expect(loaded.completions).toHaveLength(1);
  });
});

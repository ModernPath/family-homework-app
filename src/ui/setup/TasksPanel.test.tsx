import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { TasksPanel } from "@/ui/setup/TasksPanel";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask, formatDeactivateTaskMessage } from "@/domain/tasks";

const NOW = new Date("2026-09-02T10:00:00.000Z");

async function seedTaskStore() {
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
      schedule: { type: "daily" },
      assignment: {
        type: "rotation",
        memberIds: [h.members[0]!.id, h.members[1]!.id],
      },
      points: 10,
    },
    NOW,
  );
  if (!task.ok) throw new Error(task.error);
  await store.save(task.value);
  return store;
}

async function pickIcon(form: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(form).getByRole("option", { name: "🍽️" }));
}

describe("TasksPanel", () => {
  it("creates a weekdays task with selected days", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    let h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    await store.save(added.value);

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
    await user.type(within(form).getByLabelText("Title"), "Trash");
    await pickIcon(form, user);
    await user.click(within(form).getByRole("radio", { name: "Weekdays" }));
    await user.click(within(form).getByRole("checkbox", { name: "Sat" }));
    await user.click(within(form).getByRole("radio", { name: "Pool" }));
    await user.click(within(form).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText(/Trash/)).toBeTruthy();
    });

    const loaded = await store.load();
    const task = loaded.tasks[0]!;
    expect(task.schedule).toEqual({ type: "weekdays", days: [1, 2, 3, 4, 5, 6] });
    expect(task.assignment.type).toBe("pool");
  });

  it("edits an existing task", async () => {
    const user = userEvent.setup();
    const store = await seedTaskStore();

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Edit Dishes" }));
    const form = screen.getByRole("heading", { name: "Edit task" }).closest("form")!;
    const titleInput = within(form).getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Kitchen");
    await user.click(within(form).getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByText("Kitchen")).toBeTruthy();
    });
    const loaded = await store.load();
    expect(loaded.tasks[0]!.title).toBe("Kitchen");
  });

  it("shows title length error for 31 characters", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    await store.save(createEmptyHousehold(NOW));

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
    await user.type(within(form).getByLabelText("Title"), "a".repeat(31));
    await pickIcon(form, user);
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title must be 30 characters or fewer")).toBeTruthy();
    expect((await store.load()).tasks).toHaveLength(0);
  });

  it("shows rotation member error with fewer than two members", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    let h = createEmptyHousehold(NOW);
    const added = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
    if (!added.ok) throw new Error(added.error);
    await store.save(added.value);

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
    await user.type(within(form).getByLabelText("Title"), "Dishes");
    await pickIcon(form, user);
    await user.click(within(form).getByRole("radio", { name: "Rotation" }));
    await user.click(within(form).getByRole("checkbox", { name: "Emma" }));
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Rotation requires at least 2 members")).toBeTruthy();
    expect((await store.load()).tasks).toHaveLength(0);
  });

  it("shows icon error when icon is missing", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    await store.save(createEmptyHousehold(NOW));

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    const form = screen.getByRole("button", { name: "Save" }).closest("form")!;
    await user.type(within(form).getByLabelText("Title"), "Dishes");
    await user.click(within(form).getByRole("radio", { name: "Pool" }));
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Choose an icon")).toBeTruthy();
    expect((await store.load()).tasks).toHaveLength(0);
  });

  it("requires confirmation before deactivating a task", async () => {
    const user = userEvent.setup();
    const store = await seedTaskStore();

    render(
      <HouseholdProvider store={store}>
        <TasksPanel />
      </HouseholdProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Deactivate" }));
    expect(screen.getByText(formatDeactivateTaskMessage("Dishes"))).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect((await store.load()).tasks[0]!.active).toBe(true);

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(async () => {
      expect((await store.load()).tasks[0]!.active).toBe(false);
    });
  });
});

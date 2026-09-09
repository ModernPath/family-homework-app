import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { BackupPanel } from "@/ui/setup/BackupPanel";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask } from "@/domain/tasks";
import { translate } from "@/i18n/messages";
import { serializeHousehold } from "@/store/exportImport";

const NOW = new Date("2026-09-02T10:00:00.000Z");

async function buildBackupJson() {
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
      assignment: { type: "pool" },
    },
    NOW,
  );
  if (!task.ok) throw new Error(task.error);
  return serializeHousehold(task.value);
}

describe("BackupPanel", () => {
  it("shows export and import controls", () => {
    const store = createInMemoryStore();

    render(
      <HouseholdProvider store={store}>
        <BackupPanel />
      </HouseholdProvider>,
    );

    expect(screen.getByRole("button", { name: "Export backup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Import backup" })).toBeTruthy();
  });

  it("shows preview counts before import confirm", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    await store.save(createEmptyHousehold(NOW));
    const backup = await buildBackupJson();

    render(
      <HouseholdProvider store={store}>
        <BackupPanel />
      </HouseholdProvider>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([backup], "family-task-board-backup.json", {
      type: "application/json",
    });
    await user.upload(input, file);

    expect(
      await screen.findByText(
        translate("en", "backup.previewCounts", { members: 2, tasks: 1 }),
      ),
    ).toBeTruthy();
    expect(screen.getByText(translate("en", "backup.importConfirm"))).toBeTruthy();
  });

  it("imports after confirm", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    await store.save(createEmptyHousehold(NOW));
    const backup = await buildBackupJson();

    render(
      <HouseholdProvider store={store}>
        <BackupPanel />
      </HouseholdProvider>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([backup], "family-task-board-backup.json", {
      type: "application/json",
    });
    await user.upload(input, file);
    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(async () => {
      const loaded = await store.load();
      expect(loaded.members).toHaveLength(2);
      expect(loaded.tasks).toHaveLength(1);
    });
  });
});

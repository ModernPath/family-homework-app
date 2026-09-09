import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { MembersPanel } from "@/ui/setup/MembersPanel";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { translate } from "@/i18n/messages";

const NOW = new Date("2026-09-02T10:00:00.000Z");

function seedStore() {
  const store = createInMemoryStore();
  let h = createEmptyHousehold(NOW);
  const added = addMember(h, { name: "Emma", color: "#3B82F6", avatar: "👧" }, NOW);
  if (!added.ok) throw new Error(added.error);
  void store.save(added.value);
  return store;
}

describe("MembersPanel", () => {
  it("adds a member through the form", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();

    render(
      <HouseholdProvider store={store}>
        <MembersPanel />
      </HouseholdProvider>,
    );

    const form = screen.getByRole("heading", { name: "Add member" }).closest("form")!;
    await user.type(within(form).getByRole("textbox", { name: "Name" }), "Emma");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(within(screen.getByRole("list", { name: "Members" })).getByText("Emma")).toBeTruthy();
    });
  });

  it("edits a member name and avatar", async () => {
    const user = userEvent.setup();
    const store = seedStore();

    render(
      <HouseholdProvider store={store}>
        <MembersPanel />
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Emma" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Edit Emma" }));
    const form = screen.getByRole("heading", { name: "Edit member" }).closest("form")!;
    const nameInput = within(form).getByRole("textbox", { name: "Name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Em");
    await user.click(screen.getByRole("radio", { name: "Medium" }));
    const avatarPicker = screen.getByText("Style").closest(".avatar-picker") as HTMLElement;
    await user.click(within(avatarPicker).getByRole("option", { name: "Man" }));
    await user.click(within(form).getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Em" })).toBeTruthy();
    });
    const loaded = await store.load();
    expect(loaded.members[0]!.name).toBe("Em");
    expect(loaded.members[0]!.avatar).toBe("👨🏽");
  });

  it("requires confirmation before deleting a member", async () => {
    const user = userEvent.setup();
    const store = seedStore();

    render(
      <HouseholdProvider store={store}>
        <MembersPanel />
      </HouseholdProvider>,
    );

    await user.click(await screen.findByRole("button", { name: "Delete Emma" }));
    expect(
      screen.getByText(translate("en", "members.deleteConfirm", { name: "Emma" })),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await store.load()).toMatchObject({ members: [{ name: "Emma" }] });

    await user.click(screen.getByRole("button", { name: "Delete Emma" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(async () => {
      expect((await store.load()).members).toHaveLength(0);
    });
  });

  it("shows Finnish chrome and name-required error", async () => {
    const user = userEvent.setup();
    const store = createInMemoryStore();
    await store.save(createEmptyHousehold(NOW, "fi"));

    render(
      <HouseholdProvider store={store}>
        <MembersPanel />
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Lisää jäsen" })).toBeTruthy();
    });
    expect(screen.getByRole("radiogroup", { name: "Väri" })).toBeTruthy();

    const form = screen.getByRole("heading", { name: "Lisää jäsen" }).closest("form")!;
    await user.click(within(form).getByRole("button", { name: "Tallenna" }));

    expect(await screen.findByText("Nimi on pakollinen")).toBeTruthy();
  });
});

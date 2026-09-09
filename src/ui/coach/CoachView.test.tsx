import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { HouseholdProvider } from "@/hooks/HouseholdProvider";
import { CoachView } from "@/ui/coach/CoachView";
import { LanguageSwitcher } from "@/ui/components/LanguageSwitcher";
import { createInMemoryStore } from "@/store/inMemoryStore";
import { createEmptyHousehold } from "@/domain/seed";
import { addMember } from "@/domain/members";
import { addTask } from "@/domain/tasks";
import { updateLocale } from "@/domain/settings";

const NOW = new Date("2026-09-02T10:00:00.000Z");
const DATE = format(NOW, "yyyy-MM-dd");

const PLAN_RESPONSE = {
  status: "success",
  intent: "plan",
  query: "Who should do what today?",
  locale: "en",
  answer: "Emma should do Dishes today.",
  plan: {
    date: DATE,
    weekday: "Wednesday",
    by_member: [
      {
        member_id: "m1",
        member_name: "Emma",
        color: "#3B82F6",
        tasks: [
          {
            task_id: "dishes",
            title: "Dishes",
            icon: "🍽️",
            date: DATE,
            when: "Wednesday",
            schedule_label: "every day",
            assignment_type: "rotation",
            completed: false,
            points: 10,
            member_id: "m1",
          },
        ],
      },
    ],
    open_pool: [],
  },
  contributions: {
    reference_date: DATE,
    week_start: "2026-08-31",
    week_end: "2026-09-06",
    members: [
      {
        member_id: "m1",
        member_name: "Emma",
        week_completions: 0,
        week_points: 0,
        all_time_completions: 0,
        all_time_points: 0,
      },
    ],
    most_active_ids: [],
    most_active_names: [],
  },
};

async function seedStore(locale: "en" | "fi" = "en") {
  const store = createInMemoryStore();
  let h = createEmptyHousehold(NOW, locale);
  const m1 = addMember(h, { name: "Emma", color: "#3B82F6" }, NOW);
  if (!m1.ok) throw new Error("member");
  h = m1.value;
  const m2 = addMember(h, { name: "Dad", color: "#22C55E" }, NOW);
  if (!m2.ok) throw new Error("member");
  h = m2.value;
  const localeResult = updateLocale(h, locale);
  if (localeResult.ok) h = localeResult.value;
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

describe("CoachView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows Emma and Dishes after tapping Today's plan", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => PLAN_RESPONSE,
      }),
    );
    const store = await seedStore("en");

    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <CoachView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Today's plan" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Today's plan" }));

    await waitFor(() => {
      expect(screen.getByText("Emma should do Dishes today.")).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "Emma" })).toBeTruthy();
    expect(screen.getByText(/🍽️ Dishes/)).toBeTruthy();
  });

  it("shows unavailable message when the API is down", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const store = await seedStore("en");

    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <CoachView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Today's plan" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Today's plan" }));

    await waitFor(() => {
      expect(
        screen.getByText("Coach is unavailable. Start the homework coach API."),
      ).toBeTruthy();
    });
  });

  it("re-asks in Finnish after switching locale", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => PLAN_RESPONSE,
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = await seedStore("en");

    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <LanguageSwitcher />
          <CoachView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Today's plan" })).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Today's plan" }));
    await waitFor(() => {
      expect(screen.getByText("Emma should do Dishes today.")).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "FI" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const second = fetchMock.mock.calls[1] as [string, { body: string }];
    expect(JSON.parse(second[1].body).locale).toBe("fi");
  });

  it("renders Finnish chrome", async () => {
    const store = await seedStore("fi");
    render(
      <HouseholdProvider store={store}>
        <MemoryRouter>
          <CoachView />
        </MemoryRouter>
      </HouseholdProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Valmentaja" })).toBeTruthy();
    });
    expect(
      screen.getByRole("button", { name: "Tämän päivän suunnitelma" }),
    ).toBeTruthy();
  });
});

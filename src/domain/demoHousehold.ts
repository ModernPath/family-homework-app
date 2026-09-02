import type { Household, Member, Reward, Task } from "./types";
import { MEMBER_COLOR_PALETTE } from "./types";
import { buildAvatar, skinToneById } from "./avatarTone";

/** Stable IDs so rotation order stays predictable across imports. */
export const VUORIO_MEMBER_IDS = {
  pasi: "vuorio-pasi",
  minna: "vuorio-minna",
  sini: "vuorio-sini",
  saara: "vuorio-saara",
  miska: "vuorio-miska",
} as const;

const ALL_MEMBERS = [
  VUORIO_MEMBER_IDS.pasi,
  VUORIO_MEMBER_IDS.minna,
  VUORIO_MEMBER_IDS.sini,
  VUORIO_MEMBER_IDS.saara,
  VUORIO_MEMBER_IDS.miska,
];

const TEENS = [
  VUORIO_MEMBER_IDS.sini,
  VUORIO_MEMBER_IDS.saara,
  VUORIO_MEMBER_IDS.miska,
];

function member(
  id: string,
  name: string,
  color: string,
  avatar: string,
  iso: string,
): Member {
  return { id, name, color, avatar, createdAt: iso, updatedAt: iso };
}

function task(
  id: string,
  title: string,
  icon: string,
  schedule: Task["schedule"],
  assignment: Task["assignment"],
  points: number,
  iso: string,
): Task {
  return {
    id,
    title,
    icon,
    schedule,
    assignment,
    points,
    active: true,
    createdAt: iso,
    updatedAt: iso,
  };
}

function reward(id: string, title: string, cost: number, iso: string): Reward {
  return {
    id,
    title,
    cost,
    active: true,
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Sample household for the Vuorio family — Pasi, Minna, Sini, Saara, Miska.
 * Use via Backup → "Load sample family" or import `public/vuorio-household-backup.json`.
 */
export function createVuorioHousehold(now: Date = new Date()): Household {
  const iso = now.toISOString();

  const members: Member[] = [
    member(
      VUORIO_MEMBER_IDS.pasi,
      "Pasi",
      MEMBER_COLOR_PALETTE[0],
      buildAvatar("👨", skinToneById("medium-light")),
      iso,
    ),
    member(
      VUORIO_MEMBER_IDS.minna,
      "Minna",
      MEMBER_COLOR_PALETTE[5],
      buildAvatar("👩", skinToneById("medium-light")),
      iso,
    ),
    member(
      VUORIO_MEMBER_IDS.sini,
      "Sini",
      MEMBER_COLOR_PALETTE[4],
      buildAvatar("👧", skinToneById("medium-light")),
      iso,
    ),
    member(
      VUORIO_MEMBER_IDS.saara,
      "Saara",
      MEMBER_COLOR_PALETTE[6],
      buildAvatar("👱‍♀️", skinToneById("light")),
      iso,
    ),
    member(
      VUORIO_MEMBER_IDS.miska,
      "Miska",
      MEMBER_COLOR_PALETTE[3],
      buildAvatar("👦", skinToneById("medium-light")),
      iso,
    ),
  ];

  const tasks: Task[] = [
    task(
      "task-dishes",
      "Dishes",
      "🍽️",
      { type: "daily" },
      { type: "rotation", memberIds: [...ALL_MEMBERS] },
      10,
      iso,
    ),
    task(
      "task-trash",
      "Trash",
      "🗑️",
      { type: "daily" },
      { type: "rotation", memberIds: [...ALL_MEMBERS] },
      10,
      iso,
    ),
    task(
      "task-counters",
      "Kitchen counters",
      "🧽",
      { type: "daily" },
      {
        type: "rotation",
        memberIds: [VUORIO_MEMBER_IDS.minna, ...TEENS],
      },
      8,
      iso,
    ),
    task(
      "task-vacuum",
      "Vacuum",
      "🧹",
      { type: "weekly", day: 6 },
      { type: "rotation", memberIds: [...ALL_MEMBERS] },
      15,
      iso,
    ),
    task(
      "task-laundry",
      "Laundry",
      "🧺",
      { type: "weekly", day: 7 },
      {
        type: "rotation",
        memberIds: [
          VUORIO_MEMBER_IDS.minna,
          VUORIO_MEMBER_IDS.sini,
          VUORIO_MEMBER_IDS.saara,
        ],
      },
      20,
      iso,
    ),
    task(
      "task-tidy",
      "Tidy living room",
      "🛋️",
      { type: "weekdays", days: [1, 2, 3, 4, 5] },
      { type: "pool" },
      12,
      iso,
    ),
    task(
      "task-recycling",
      "Recycling",
      "♻️",
      { type: "daily" },
      { type: "pool" },
      8,
      iso,
    ),
    task(
      "task-dinner-prep",
      "Dinner prep help",
      "🍳",
      { type: "weekdays", days: [1, 2, 3, 4, 5] },
      {
        type: "rotation",
        memberIds: [
          VUORIO_MEMBER_IDS.pasi,
          VUORIO_MEMBER_IDS.minna,
          VUORIO_MEMBER_IDS.sini,
          VUORIO_MEMBER_IDS.saara,
        ],
      },
      12,
      iso,
    ),
    task(
      "task-yard",
      "Yard / outdoor",
      "🌱",
      { type: "weekly", day: 6 },
      {
        type: "rotation",
        memberIds: [
          VUORIO_MEMBER_IDS.pasi,
          VUORIO_MEMBER_IDS.miska,
          VUORIO_MEMBER_IDS.saara,
        ],
      },
      18,
      iso,
    ),
  ];

  const rewards: Reward[] = [
    reward("reward-movie", "Movie night", 50, iso),
    reward("reward-dinner", "Choose dinner", 40, iso),
    reward("reward-sleepin", "Sleep in Saturday", 30, iso),
  ];

  return {
    members,
    tasks,
    completions: [],
    overrides: [],
    rewards,
    redemptions: [],
    settings: { weekStartsOn: 1, locale: "en" },
    meta: { schemaVersion: 1, lastModified: iso },
  };
}

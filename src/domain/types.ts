export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface Member {
  id: string;
  name: string;
  color: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Schedule =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] }
  | { type: "weekly"; day: number }
  | { type: "once"; date: string };

export type Assignment =
  | { type: "rotation"; memberIds: string[] }
  | { type: "pool" };

export interface Task {
  id: string;
  title: string;
  icon: string;
  schedule: Schedule;
  assignment: Assignment;
  points: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Completion {
  id: string;
  taskId: string;
  memberId: string;
  date: string;
  points: number;
  createdAt: string;
}

export interface Override {
  taskId: string;
  date: string;
  memberId: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  memberId: string;
  date: string;
  pointsSpent: number;
  createdAt: string;
}

export type AppLocale = "en" | "fi";

export interface HouseholdSettings {
  weekStartsOn: 1;
  locale: AppLocale;
}

export interface HouseholdMeta {
  schemaVersion: 1;
  lastModified: string;
}

export interface Household {
  members: Member[];
  tasks: Task[];
  completions: Completion[];
  overrides: Override[];
  rewards: Reward[];
  redemptions: Redemption[];
  settings: HouseholdSettings;
  meta: HouseholdMeta;
}

export const MAX_MEMBERS = 6;

export const MEMBER_COLOR_PALETTE = [
  "#3B82F6",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
] as const;

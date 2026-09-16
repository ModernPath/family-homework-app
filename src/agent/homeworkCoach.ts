import type { Household } from "@/domain/types";

export interface CoachTaskItem {
  task_id: string;
  title: string;
  icon: string;
  date: string;
  when: string;
  schedule_label: string;
  assignment_type: "rotation" | "pool";
  completed: boolean;
  points: number;
  member_id?: string | null;
}

export interface CoachMemberPlan {
  member_id: string;
  member_name: string;
  color?: string;
  tasks: CoachTaskItem[];
}

export interface CoachDayPlan {
  date: string;
  weekday: string;
  by_member: CoachMemberPlan[];
  open_pool: CoachTaskItem[];
}

export interface CoachContributionRow {
  member_id: string;
  member_name: string;
  color?: string;
  week_completions: number;
  week_points: number;
  all_time_completions: number;
  all_time_points: number;
}

export interface CoachContributions {
  reference_date: string;
  week_start: string;
  week_end: string;
  members: CoachContributionRow[];
  most_active_ids: string[];
  most_active_names: string[];
}

export interface CoachAskResponse {
  status: string;
  intent: "plan" | "contributions" | "both";
  query: string;
  locale: string;
  answer: string;
  plan: CoachDayPlan;
  week_plan?: { week_start: string; week_end: string; days: CoachDayPlan[] };
  contributions: CoachContributions;
}

export const COACH_UNAVAILABLE_EN =
  "Coach is unavailable. Start the homework coach API.";

export function coachApiBase(): string {
  const fromEnv = import.meta.env.VITE_HOMEWORK_COACH_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8001";
  }
  return "/agent-api";
}

export async function askHomeworkCoach(input: {
  household: Household;
  query: string;
  date?: string;
  locale: string;
}): Promise<CoachAskResponse> {
  const response = await fetch(`${coachApiBase()}/coach/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      household: input.household,
      query: input.query,
      date: input.date,
      locale: input.locale,
    }),
  });
  if (!response.ok) {
    throw new Error(COACH_UNAVAILABLE_EN);
  }
  return (await response.json()) as CoachAskResponse;
}

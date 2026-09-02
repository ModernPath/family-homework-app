import { endOfISOWeek, parse, startOfISOWeek } from "date-fns";
import type { Household } from "./types";

function parseDateString(date: string): Date {
  return parse(date, "yyyy-MM-dd", new Date());
}

function isDateInWeek(date: string, referenceDate: string): boolean {
  const d = parseDateString(date);
  const ref = parseDateString(referenceDate);
  const start = startOfISOWeek(ref);
  const end = endOfISOWeek(ref);
  return d >= start && d <= end;
}

export function weekPoints(
  household: Household,
  memberId: string,
  referenceDate: string,
): number {
  const earned = household.completions
    .filter((c) => c.memberId === memberId && isDateInWeek(c.date, referenceDate))
    .reduce((sum, c) => sum + c.points, 0);

  const spent = household.redemptions
    .filter((r) => r.memberId === memberId && isDateInWeek(r.date, referenceDate))
    .reduce((sum, r) => sum + r.pointsSpent, 0);

  return earned - spent;
}

export function allTimePoints(household: Household, memberId: string): number {
  const earned = household.completions
    .filter((c) => c.memberId === memberId)
    .reduce((sum, c) => sum + c.points, 0);

  const spent = household.redemptions
    .filter((r) => r.memberId === memberId)
    .reduce((sum, r) => sum + r.pointsSpent, 0);

  return earned - spent;
}

export function weekCompletionCount(
  household: Household,
  memberId: string,
  referenceDate: string,
): number {
  return household.completions.filter(
    (c) => c.memberId === memberId && isDateInWeek(c.date, referenceDate),
  ).length;
}

export function getMostActiveMemberIds(
  household: Household,
  referenceDate: string,
): string[] {
  if (household.members.length === 0) {
    return [];
  }

  const counts = household.members.map((m) => ({
    id: m.id,
    count: weekCompletionCount(household, m.id, referenceDate),
  }));

  const max = Math.max(...counts.map((c) => c.count));
  if (max === 0) {
    return [];
  }

  return counts.filter((c) => c.count === max).map((c) => c.id);
}

export function formatPointsBadge(points: number): string {
  return `${points} pts`;
}

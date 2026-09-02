import { addDays, format } from "date-fns";
import { useMemo, useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { getRotationAssignee } from "@/domain/rotation";
import { occursOnDate } from "@/domain/occurrences";
import {
  getDateRangeStrings,
  getPoolTasksForWeek,
  getRotationTasksForWeek,
} from "@/domain/queries";
import { saveOverride } from "@/domain/overrides";
import { MemberPicker } from "@/ui/components/MemberPicker";
import { MemberBadge } from "@/ui/components/MemberBadge";

interface OverrideTarget {
  taskId: string;
  date: string;
}

export function WeekView() {
  const { household, loading, dispatch } = useHousehold();
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null);
  const startDate = format(new Date(), "yyyy-MM-dd");
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd")),
    [],
  );
  const dateRange = useMemo(() => getDateRangeStrings(startDate, 7), [startDate]);
  const rotationTasks = getRotationTasksForWeek(household, dateRange);
  const poolTasks = getPoolTasksForWeek(household, dateRange);

  if (loading) {
    return <p className="empty-state">Loading…</p>;
  }

  return (
    <div>
      <h1 className="page-title">This week</h1>
      <div className="week-grid-wrapper">
        <table className="week-grid">
          <thead>
            <tr>
              <th>Task</th>
              {dates.map((dateStr) => (
                <th key={dateStr}>{format(new Date(`${dateStr}T12:00:00`), "EEE M/d")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rotationTasks.map((task) => (
              <tr key={task.id}>
                <td>
                  {task.icon} {task.title}
                </td>
                {dates.map((dateStr) => {
                  if (!occursOnDate(task, dateStr)) {
                    return (
                      <td key={dateStr} className="week-cell empty">
                        —
                      </td>
                    );
                  }
                  const memberId = getRotationAssignee(task, dateStr, household.overrides);
                  const member = household.members.find((m) => m.id === memberId);
                  return (
                    <td key={dateStr}>
                      <button
                        type="button"
                        className="week-cell"
                        onClick={() => setOverrideTarget({ taskId: task.id, date: dateStr })}
                      >
                        {member ? (
                          <MemberBadge member={member} dotClassName="member-dot" />
                        ) : (
                          "—"
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Open tasks</h2>
      <ul className="open-tasks-list">
        {poolTasks.map((task) => (
          <li key={task.id}>
            <span>{task.icon}</span>
            <span>{task.title}</span>
            <span className="pool-badge">Anyone</span>
          </li>
        ))}
      </ul>

      {overrideTarget && (
        <MemberPicker
          members={household.members}
          onSelect={(memberId) => {
            void dispatch((h) =>
              saveOverride(h, {
                taskId: overrideTarget.taskId,
                date: overrideTarget.date,
                memberId,
              }),
            );
            setOverrideTarget(null);
          }}
          onCancel={() => setOverrideTarget(null)}
        />
      )}
    </div>
  );
}

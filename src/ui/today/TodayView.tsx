import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { getPoolTasksForToday, getRotationTasksForMemberOnDate } from "@/domain/queries";
import {
  getMostActiveMemberIds,
  weekCompletionCount,
  allTimePoints,
  formatPointsBadge,
} from "@/domain/points";
import {
  completeRotationTask,
  uncompleteRotationTask,
  isTaskCompletedOnDate,
  completePoolTask,
} from "@/domain/completions";
import { getActiveRewards, formatRewardRow } from "@/domain/rewards";
import { TaskCard } from "@/ui/components/TaskCard";
import { MemberPicker } from "@/ui/components/MemberPicker";
import { MemberBadge } from "@/ui/components/MemberBadge";
import { PointsPopup } from "@/ui/components/PointsPopup";
import type { Task } from "@/domain/types";

function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function todayHeading(): string {
  return format(new Date(), "EEEE, MMM d");
}

export function TodayView() {
  const { household, loading, dispatch } = useHousehold();
  const [poolTask, setPoolTask] = useState<Task | null>(null);
  const [pointsFlash, setPointsFlash] = useState<number | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const date = todayString();
  const members = useMemo(
    () => [...household.members].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [household.members],
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const activeMemberId = selectedMemberId ?? members[0]?.id ?? null;
  const mostActive = getMostActiveMemberIds(household, date);
  const poolTasks = getPoolTasksForToday(household, date);
  const activeRewards = getActiveRewards(household);

  const clearPointsFlash = useCallback(() => setPointsFlash(null), []);

  if (loading) {
    return <p className="empty-state">Loading…</p>;
  }

  const selectedMember = members.find((m) => m.id === activeMemberId);
  const rotationTasks = activeMemberId
    ? getRotationTasksForMemberOnDate(household, activeMemberId, date)
    : [];

  return (
    <div>
      <h1 className="page-title">{todayHeading()}</h1>

      <section className="anyone-section">
        <h2 className="section-title">Anyone</h2>
        {poolTasks.length === 0 ? (
          <p className="empty-state">Nothing scheduled today</p>
        ) : (
          poolTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              checked={false}
              onTap={() => setPoolTask(task)}
            />
          ))
        )}
      </section>

      {members.length > 1 && (
        <div className="member-tabs" role="tablist">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              role="tab"
              aria-selected={member.id === activeMemberId}
              className={`member-tab${mostActive.includes(member.id) ? " most-active" : ""}`}
              style={
                member.id === activeMemberId
                  ? { borderTopColor: member.color }
                  : undefined
              }
              onClick={() => setSelectedMemberId(member.id)}
            >
              <MemberBadge member={member} />
              <span className="points-badge">
                {formatPointsBadge(allTimePoints(household, member.id))}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedMember && (
        <section
          className="member-lane"
          style={{ borderTop: `4px solid ${selectedMember.color}` }}
        >
          {rotationTasks.length === 0 ? (
            <p className="empty-state">Nothing scheduled today</p>
          ) : (
            rotationTasks.map((task) => {
              const checked = isTaskCompletedOnDate(household, task.id, date);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  checked={checked}
                  onTap={() => {
                    void dispatch((h) => {
                      if (checked) {
                        return uncompleteRotationTask(h, task.id, date);
                      }
                      const result = completeRotationTask(
                        h,
                        task.id,
                        selectedMember.id,
                        date,
                      );
                      if (result.ok) {
                        setPointsFlash(task.points);
                      }
                      return result;
                    });
                  }}
                />
              );
            })
          )}
        </section>
      )}

      {activeRewards.length > 0 && (
        <section className="rewards-section">
          <button type="button" className="rewards-toggle" onClick={() => setRewardsOpen((v) => !v)}>
            Rewards
          </button>
          {rewardsOpen && (
            <ul className="rewards-list">
              {activeRewards.map((reward) => (
                <li key={reward.id}>{formatRewardRow(reward)}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="activity-strip">
        {members.map((member) => (
          <span
            key={member.id}
            className={`activity-chip${mostActive.includes(member.id) ? " most-active" : ""}`}
          >
            {member.name} {weekCompletionCount(household, member.id, date)}
          </span>
        ))}
        {mostActive.map((id) => {
          const member = members.find((m) => m.id === id);
          return member ? (
            <span key={`star-${id}`} className="most-active-label">
              ★ {member.name} most active
            </span>
          ) : null;
        })}
      </footer>

      {poolTask && (
        <MemberPicker
          members={members}
          onSelect={(memberId) => {
            void dispatch((h) => {
              const result = completePoolTask(h, poolTask.id, memberId, date);
              if (result.ok) {
                setPointsFlash(poolTask.points);
              }
              return result;
            });
            setPoolTask(null);
          }}
          onCancel={() => setPoolTask(null)}
        />
      )}

      {pointsFlash !== null && (
        <PointsPopup points={pointsFlash} onDone={clearPointsFlash} />
      )}
    </div>
  );
}

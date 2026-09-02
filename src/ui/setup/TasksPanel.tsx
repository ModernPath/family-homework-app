import { useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { addTask, deactivateTask, formatDeactivateTaskMessage, updateTask } from "@/domain/tasks";
import type { Task } from "@/domain/types";
import { EmojiPicker } from "@/ui/components/EmojiPicker";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";
import { WEEKDAY_OPTIONS } from "@/ui/constants";
import {
  buildAssignmentFromForm,
  buildScheduleFromForm,
  DEFAULT_TASK_FORM,
  taskToFormState,
  type SchedulePreset,
  type TaskFormState,
} from "@/ui/setup/taskFormState";

export function TasksPanel() {
  const { household, dispatch } = useHousehold();
  const [form, setForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setForm(DEFAULT_TASK_FORM);
    setEditingId(null);
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm(taskToFormState(task));
    setError(null);
  }

  function updateForm(patch: Partial<TaskFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleWeekday(day: number) {
    setForm((current) => ({
      ...current,
      weekdayDays: current.weekdayDays.includes(day)
        ? current.weekdayDays.filter((d) => d !== day)
        : [...current.weekdayDays, day],
    }));
  }

  const deactivateTarget = household.tasks.find((t) => t.id === deactivateTargetId);

  return (
    <div className="setup-panel setup-panel--split">
      <section className="setup-panel__list">
        <ul className="item-list">
        {household.tasks
          .filter((t) => t.active)
          .map((task) => (
            <li key={task.id} className="item-card">
              <span className="item-card__avatar">{task.icon}</span>
              <div className="item-card__body">
                <p className="item-card__title">{task.title}</p>
                <p className="item-card__meta">
                  {task.assignment.type === "rotation" ? "Rotation" : "Pool"} · {task.points} pts
                </p>
              </div>
              <div className="item-card__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Edit ${task.title}`}
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost"
                  onClick={() => {
                    setDeactivateTargetId(task.id);
                    setError(null);
                  }}
                >
                  Deactivate
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="setup-panel__editor">
        <form
          className="setup-form"
        onSubmit={(event) => {
          event.preventDefault();
          void dispatch((h) => {
            const payload = {
              title: form.title,
              icon: form.icon,
              schedule: buildScheduleFromForm(form),
              assignment: buildAssignmentFromForm(form),
              points: form.points,
            };
            const result = editingId
              ? updateTask(h, editingId, payload)
              : addTask(h, payload);
            if (result.ok) {
              resetForm();
              setError(null);
            } else {
              setError(result.error);
            }
            return result;
          });
        }}
      >
        <h2 className="section-title">{editingId ? "Edit task" : "Add task"}</h2>

        <div className="form-field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            aria-label="Title"
          />
        </div>

        <div className="form-field">
          <span>Icon</span>
          <EmojiPicker value={form.icon} onChange={(icon) => updateForm({ icon })} />
        </div>

        <fieldset>
          <legend>Schedule</legend>
          <div className="radio-group">
            {(["Daily", "Weekdays", "Weekly", "Once"] as const).map((label) => (
              <label key={label}>
                <input
                  type="radio"
                  name="schedule"
                  checked={form.preset === label.toLowerCase()}
                  onChange={() =>
                    updateForm({ preset: label.toLowerCase() as SchedulePreset })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {form.preset === "weekdays" && (
          <fieldset>
            <legend>On these days</legend>
            <div className="checkbox-group">
              {WEEKDAY_OPTIONS.map(({ value, label }) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={form.weekdayDays.includes(value)}
                    onChange={() => toggleWeekday(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {form.preset === "weekly" && (
          <div className="form-field">
            <label htmlFor="weekly-day">Day of week</label>
            <select
              id="weekly-day"
              value={form.weeklyDay}
              onChange={(e) => updateForm({ weeklyDay: Number(e.target.value) })}
              aria-label="Day of week"
            >
              {WEEKDAY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.preset === "once" && (
          <div className="form-field">
            <label htmlFor="once-date">Date</label>
            <input
              id="once-date"
              type="date"
              value={form.onceDate}
              onChange={(e) => updateForm({ onceDate: e.target.value })}
            />
          </div>
        )}

        <fieldset>
          <legend>Assignment</legend>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="assignment"
                checked={form.assignmentType === "rotation"}
                onChange={() => updateForm({ assignmentType: "rotation" })}
              />
              Rotation
            </label>
            <label>
              <input
                type="radio"
                name="assignment"
                checked={form.assignmentType === "pool"}
                onChange={() =>
                  updateForm({ assignmentType: "pool", rotationMemberIds: [] })
                }
              />
              Pool
            </label>
          </div>
        </fieldset>

        {form.assignmentType === "rotation" && (
          <fieldset>
            <legend>Rotation order</legend>
            <div className="checkbox-group">
              {household.members.map((member) => (
                <label key={member.id}>
                  <input
                    type="checkbox"
                    checked={form.rotationMemberIds.includes(member.id)}
                    onChange={(e) => {
                      setForm((current) => ({
                        ...current,
                        rotationMemberIds: e.target.checked
                          ? [...current.rotationMemberIds, member.id]
                          : current.rotationMemberIds.filter((id) => id !== member.id),
                      }));
                    }}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="form-field">
          <label htmlFor="task-points">Points</label>
          <input
            id="task-points"
            type="number"
            min={1}
            max={100}
            value={form.points}
            onChange={(e) => updateForm({ points: Number(e.target.value) })}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update" : "Save"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
      </section>

      {deactivateTarget && (
        <ConfirmDialog
          message={formatDeactivateTaskMessage(deactivateTarget.title)}
          onCancel={() => setDeactivateTargetId(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = deactivateTask(h, deactivateTarget.id);
              if (!result.ok) setError(result.error);
              else if (editingId === deactivateTarget.id) resetForm();
              setDeactivateTargetId(null);
              return result;
            });
          }}
        />
      )}

    </div>
  );
}

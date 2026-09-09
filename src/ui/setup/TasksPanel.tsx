import { useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { useTranslation } from "@/i18n/useTranslation";
import { getWeekdayOptions } from "@/i18n/weekdays";
import { addTask, deactivateTask, updateTask } from "@/domain/tasks";
import type { Task } from "@/domain/types";
import { EmojiPicker } from "@/ui/components/EmojiPicker";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";
import {
  buildAssignmentFromForm,
  buildScheduleFromForm,
  DEFAULT_TASK_FORM,
  taskToFormState,
  type SchedulePreset,
  type TaskFormState,
} from "@/ui/setup/taskFormState";

const SCHEDULE_PRESETS: { preset: SchedulePreset; key: "tasks.schedule.daily" | "tasks.schedule.weekdays" | "tasks.schedule.weekly" | "tasks.schedule.once" }[] = [
  { preset: "daily", key: "tasks.schedule.daily" },
  { preset: "weekdays", key: "tasks.schedule.weekdays" },
  { preset: "weekly", key: "tasks.schedule.weekly" },
  { preset: "once", key: "tasks.schedule.once" },
];

export function TasksPanel() {
  const { household, dispatch } = useHousehold();
  const { t, te, locale } = useTranslation();
  const weekdayOptions = getWeekdayOptions(locale);
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
          .filter((task) => task.active)
          .map((task) => (
            <li key={task.id} className="item-card">
              <span className="item-card__avatar">{task.icon}</span>
              <div className="item-card__body">
                <p className="item-card__title">{task.title}</p>
                <p className="item-card__meta">
                  {task.assignment.type === "rotation"
                    ? t("tasks.rotation")
                    : t("tasks.pool")}{" "}
                  · {task.points} {t("common.pts")}
                </p>
              </div>
              <div className="item-card__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`${t("common.edit")} ${task.title}`}
                  onClick={() => startEdit(task)}
                >
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost"
                  onClick={() => {
                    setDeactivateTargetId(task.id);
                    setError(null);
                  }}
                >
                  {t("common.deactivate")}
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
              setError(te(result.error));
            }
            return result;
          });
        }}
      >
        <h2 className="section-title">{editingId ? t("tasks.edit") : t("tasks.add")}</h2>

        <div className="form-field">
          <label htmlFor="task-title">{t("tasks.title")}</label>
          <input
            id="task-title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            aria-label={t("tasks.title")}
          />
        </div>

        <div className="form-field">
          <span>{t("tasks.icon")}</span>
          <EmojiPicker value={form.icon} onChange={(icon) => updateForm({ icon })} />
        </div>

        <fieldset>
          <legend>{t("tasks.schedule")}</legend>
          <div className="radio-group">
            {SCHEDULE_PRESETS.map(({ preset, key }) => (
              <label key={preset}>
                <input
                  type="radio"
                  name="schedule"
                  checked={form.preset === preset}
                  onChange={() => updateForm({ preset })}
                />
                {t(key)}
              </label>
            ))}
          </div>
        </fieldset>

        {form.preset === "weekdays" && (
          <fieldset>
            <legend>{t("tasks.onTheseDays")}</legend>
            <div className="checkbox-group">
              {weekdayOptions.map(({ value, label }) => (
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
            <label htmlFor="weekly-day">{t("tasks.dayOfWeek")}</label>
            <select
              id="weekly-day"
              value={form.weeklyDay}
              onChange={(e) => updateForm({ weeklyDay: Number(e.target.value) })}
              aria-label={t("tasks.dayOfWeek")}
            >
              {weekdayOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.preset === "once" && (
          <div className="form-field">
            <label htmlFor="once-date">{t("tasks.date")}</label>
            <input
              id="once-date"
              type="date"
              value={form.onceDate}
              onChange={(e) => updateForm({ onceDate: e.target.value })}
            />
          </div>
        )}

        <fieldset>
          <legend>{t("tasks.assignment")}</legend>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="assignment"
                checked={form.assignmentType === "rotation"}
                onChange={() => updateForm({ assignmentType: "rotation" })}
              />
              {t("tasks.rotation")}
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
              {t("tasks.pool")}
            </label>
          </div>
        </fieldset>

        {form.assignmentType === "rotation" && (
          <fieldset>
            <legend>{t("tasks.rotationOrder")}</legend>
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
          <label htmlFor="task-points">{t("tasks.points")}</label>
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
            {editingId ? t("common.update") : t("common.save")}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
      </section>

      {deactivateTarget && (
        <ConfirmDialog
          message={t("tasks.deactivateConfirm", { title: deactivateTarget.title })}
          onCancel={() => setDeactivateTargetId(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = deactivateTask(h, deactivateTarget.id);
              if (!result.ok) setError(te(result.error));
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

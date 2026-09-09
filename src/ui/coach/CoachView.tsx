import { format } from "date-fns";
import { enUS, fi } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/messages";
import {
  askHomeworkCoach,
  type CoachAskResponse,
} from "@/agent/homeworkCoach";

function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function formatTaskWhen(dateStr: string, locale: Locale): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return format(date, "EEEE", { locale: locale === "fi" ? fi : enUS });
}

export function CoachView() {
  const { household, loading } = useHousehold();
  const { t, locale } = useTranslation();
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoachAskResponse | null>(null);
  const lastQueryRef = useRef("");
  const requestIdRef = useRef(0);

  async function ask(query: string) {
    const text = query.trim();
    if (!text) return;
    lastQueryRef.current = text;
    const requestId = ++requestIdRef.current;
    setPending(true);
    setError(null);
    try {
      const response = await askHomeworkCoach({
        household,
        query: text,
        date: todayString(),
        locale,
      });
      if (requestId !== requestIdRef.current) return;
      setResult(response);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setResult(null);
      setError(t("coach.unavailable"));
    } finally {
      if (requestId === requestIdRef.current) setPending(false);
    }
  }

  useEffect(() => {
    const query = lastQueryRef.current;
    if (!query) return;
    void ask(query);
    // Re-ask in the new language when the family switches EN/FI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const assignedMembers = result?.plan.by_member.filter((row) => row.tasks.length > 0) ?? [];

  if (loading) {
    return <p className="empty-state">{t("common.loading")}</p>;
  }

  return (
    <div className="coach-view">
      <h1 className="page-title">{t("coach.title")}</h1>
      <p className="coach-subtitle">{t("coach.subtitle")}</p>

      <div className="coach-prompts">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void ask(t("coach.planTodayQuery"))}
        >
          {t("coach.planToday")}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => void ask(t("coach.whoDidMostQuery"))}
        >
          {t("coach.whoDidMost")}
        </button>
      </div>

      <form
        className="coach-ask"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor="coach-question">{t("coach.question")}</label>
        <textarea
          id="coach-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("coach.thinking") : t("coach.ask")}
        </button>
      </form>

      {error ? (
        <p className="empty-state coach-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <section className="coach-answer" aria-live="polite">
            <p className="coach-answer__text">{result.answer}</p>
          </section>

          <section>
            <h2 className="section-title">{t("coach.today")}</h2>
            {assignedMembers.length === 0 ? (
              <p className="empty-state">{t("today.nothingScheduled")}</p>
            ) : (
              assignedMembers.map((row) => (
                  <article
                    key={row.member_id}
                    className="coach-card"
                    style={row.color ? { borderTopColor: row.color } : undefined}
                  >
                    <h3 className="coach-card__name">{row.member_name}</h3>
                    <ul className="coach-task-list">
                      {row.tasks.map((task) => (
                        <li key={task.task_id}>
                          {`${task.icon} ${task.title} — ${formatTaskWhen(task.date || result.plan.date, locale)} (${task.completed ? t("coach.done") : t("coach.open")})`}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
            )}
            {result.plan.open_pool.length > 0 ? (
              <article className="coach-card">
                <h3 className="coach-card__name">{t("coach.anyone")}</h3>
                <ul className="coach-task-list">
                  {result.plan.open_pool.map((task) => (
                    <li key={task.task_id}>
                      {task.icon} {task.title} — {formatTaskWhen(task.date || result.plan.date, locale)}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>

          <section>
            <h2 className="section-title">{t("coach.thisWeek")}</h2>
            <div className="coach-leaderboard">
              {result.contributions.members.map((row) => (
                <span
                  key={row.member_id}
                  className={`activity-chip${
                    result.contributions.most_active_ids.includes(row.member_id)
                      ? " most-active"
                      : ""
                  }`}
                >
                  {row.member_name} {row.week_completions}
                </span>
              ))}
            </div>
            {result.contributions.most_active_names.map((name) => (
              <p key={name} className="most-active-label">
                ★ {t("today.mostActive", { name })}
              </p>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { useTranslation } from "@/i18n/useTranslation";
import {
  addReward,
  deactivateReward,
  redeemReward,
} from "@/domain/rewards";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";

export function RewardsPanel() {
  const { household, dispatch } = useHousehold();
  const { t, te } = useTranslation();
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(50);
  const [memberId, setMemberId] = useState("");
  const [rewardId, setRewardId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const deactivateTarget = household.rewards.find((r) => r.id === deactivateTargetId);

  return (
    <div className="setup-panel setup-panel--split">
      <section className="setup-panel__list">
        <ul className="item-list">
        {household.rewards.map((reward) => (
          <li key={reward.id} className="item-card">
            <div className="item-card__body">
              <p className="item-card__title">{reward.title}</p>
              <p className="item-card__meta">
                {reward.cost} {t("common.pts")}{" "}
                {reward.active ? "" : `· ${t("common.inactive")}`}
              </p>
            </div>
            {reward.active && (
              <div className="item-card__actions">
                <button
                  type="button"
                  className="btn btn-danger-ghost"
                  onClick={() => {
                    setDeactivateTargetId(reward.id);
                    setError(null);
                  }}
                >
                  {t("common.deactivate")}
                </button>
              </div>
            )}
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
            const result = addReward(h, { title, cost });
            if (result.ok) {
              setTitle("");
              setError(null);
            } else {
              setError(te(result.error));
            }
            return result;
          });
        }}
      >
        <h2 className="section-title">{t("rewards.add")}</h2>
        <div className="form-field">
          <label htmlFor="reward-title">{t("rewards.title")}</label>
          <input id="reward-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="reward-cost">{t("rewards.cost")}</label>
          <input
            id="reward-cost"
            type="number"
            min={1}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {t("common.save")}
          </button>
        </div>
      </form>

      <form className="setup-form">
        <h2 className="section-title">{t("rewards.redeem")}</h2>
        <div className="form-field">
          <label htmlFor="redeem-member">{t("rewards.member")}</label>
          <select id="redeem-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">{t("common.selectMember")}</option>
            {household.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="redeem-reward">{t("rewards.reward")}</label>
          <select id="redeem-reward" value={rewardId} onChange={(e) => setRewardId(e.target.value)}>
            <option value="">{t("common.selectReward")}</option>
            {household.rewards
              .filter((r) => r.active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.cost} {t("common.pts")})
                </option>
              ))}
          </select>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const member = household.members.find((m) => m.id === memberId);
              const reward = household.rewards.find((r) => r.id === rewardId);
              if (!member || !reward) {
                setError(t("rewards.selectBoth"));
                return;
              }
              setConfirm(
                t("rewards.redeemConfirm", {
                  title: reward.title,
                  name: member.name,
                  cost: reward.cost,
                }),
              );
            }}
          >
            {t("rewards.redeem")}
          </button>
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}
      </section>

      {confirm && (
        <ConfirmDialog
          message={confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = redeemReward(h, rewardId, memberId, today);
              if (!result.ok) setError(te(result.error));
              else {
                setError(null);
                setConfirm(null);
              }
              return result;
            });
          }}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          message={t("rewards.deactivateConfirm", { title: deactivateTarget.title })}
          onCancel={() => setDeactivateTargetId(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = deactivateReward(h, deactivateTarget.id);
              if (!result.ok) setError(te(result.error));
              else setDeactivateTargetId(null);
              return result;
            });
          }}
        />
      )}

    </div>
  );
}

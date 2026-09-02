import { useState } from "react";
import { format } from "date-fns";
import { useHousehold } from "@/hooks/HouseholdProvider";
import {
  addReward,
  deactivateReward,
  formatDeactivateRewardMessage,
  formatRedeemConfirmMessage,
  redeemReward,
} from "@/domain/rewards";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";

export function RewardsPanel() {
  const { household, dispatch } = useHousehold();
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
                {reward.cost} pts {reward.active ? "" : "· inactive"}
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
                  Deactivate
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
              setError(result.error);
            }
            return result;
          });
        }}
      >
        <h2 className="section-title">Add reward</h2>
        <div className="form-field">
          <label htmlFor="reward-title">Title</label>
          <input id="reward-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="reward-cost">Cost</label>
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
            Save
          </button>
        </div>
      </form>

      <form className="setup-form">
        <h2 className="section-title">Redeem</h2>
        <div className="form-field">
          <label htmlFor="redeem-member">Member</label>
          <select id="redeem-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">Select member</option>
            {household.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="redeem-reward">Reward</label>
          <select id="redeem-reward" value={rewardId} onChange={(e) => setRewardId(e.target.value)}>
            <option value="">Select reward</option>
            {household.rewards
              .filter((r) => r.active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.cost} pts)
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
                setError("Select member and reward");
                return;
              }
              setConfirm(formatRedeemConfirmMessage(reward.title, member.name, reward.cost));
            }}
          >
            Redeem
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
              if (!result.ok) setError(result.error);
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
          message={formatDeactivateRewardMessage(deactivateTarget.title)}
          onCancel={() => setDeactivateTargetId(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = deactivateReward(h, deactivateTarget.id);
              if (!result.ok) setError(result.error);
              else setDeactivateTargetId(null);
              return result;
            });
          }}
        />
      )}

    </div>
  );
}

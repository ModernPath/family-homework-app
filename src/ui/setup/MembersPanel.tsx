import { useState } from "react";
import { useHousehold } from "@/hooks/HouseholdProvider";
import { addMember, formatDeleteMemberMessage, removeMember, updateMember } from "@/domain/members";
import { MEMBER_COLOR_PALETTE } from "@/domain/types";
import { AvatarPicker } from "@/ui/components/AvatarPicker";
import { ColorSwatches } from "@/ui/components/ColorSwatches";
import { ConfirmDialog } from "@/ui/components/ConfirmDialog";
import { MemberBadge } from "@/ui/components/MemberBadge";

export function MembersPanel() {
  const { household, dispatch } = useHousehold();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(MEMBER_COLOR_PALETTE[0]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setColor(MEMBER_COLOR_PALETTE[0]);
    setAvatar(null);
    setEditingId(null);
  }

  function startEdit(memberId: string) {
    const member = household.members.find((m) => m.id === memberId);
    if (!member) return;
    setEditingId(memberId);
    setName(member.name);
    setColor(member.color);
    setAvatar(member.avatar);
    setError(null);
  }

  const deleteTarget = household.members.find((m) => m.id === deleteTargetId);

  return (
    <div className="setup-panel setup-panel--split">
      <section className="setup-panel__list">
        <ul className="item-list" aria-label="Members">
          {household.members.map((member) => (
            <li key={member.id} className="item-card">
              <MemberBadge member={member} visual="list" showName={false} />
              <div className="item-card__body">
                <p className="item-card__title">{member.name}</p>
              </div>
              <div className="item-card__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Edit ${member.name}`}
                  onClick={() => startEdit(member.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger-ghost"
                  aria-label={`Delete ${member.name}`}
                  onClick={() => {
                    setDeleteTargetId(member.id);
                    setError(null);
                  }}
                >
                  Delete
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
              const result = editingId
                ? updateMember(h, editingId, { name, color, avatar })
                : addMember(h, { name, color, avatar });
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
          <h2 className="section-title">{editingId ? "Edit member" : "Add member"}</h2>

          <div className="form-field">
            <label htmlFor="member-name">Name</label>
            <input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Name"
            />
          </div>

          <div className="form-field">
            <span>Color</span>
            <ColorSwatches value={color} onChange={setColor} />
          </div>

          <div className="form-field">
            <span>Avatar</span>
            <AvatarPicker value={avatar ?? ""} onChange={(emoji) => setAvatar(emoji)} />
            {avatar && (
              <button type="button" className="btn btn-ghost" onClick={() => setAvatar(null)}>
                Clear avatar
              </button>
            )}
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

      {deleteTarget && (
        <ConfirmDialog
          message={formatDeleteMemberMessage(deleteTarget.name)}
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={() => {
            void dispatch((h) => {
              const result = removeMember(h, deleteTarget.id);
              if (!result.ok) setError(result.error);
              else {
                setError(null);
                if (editingId === deleteTarget.id) resetForm();
              }
              setDeleteTargetId(null);
              return result;
            });
          }}
        />
      )}

    </div>
  );
}

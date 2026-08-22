import { useState } from "react";
import Modal from "../ui/Modal";
import Icon from "../ui/Icon";
import { useConfirmDialog } from "../ui/confirmDialogContext";
import { leaveSharedTrip } from "../../api/collaborationApi";

function getInitials(name, email) {
  const label = (name || email || "?").trim();
  const words = label.split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function CollaborationModal({
  trip,
  accessRole,
  owner,
  collaborators,
  loading,
  saving,
  error,
  success,
  onClose,
  onInvite,
  onCancelInvitation,
  onRemoveCollaborator,
  onLeftTrip,
}) {
  const confirm = useConfirmDialog();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [leaving, setLeaving] = useState(false);
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }
  const isOwner = accessRole === "owner";
  const acceptedCollaborators = collaborators.filter(
    (collaborator) => collaborator.status === "accepted",
  );
  const otherAcceptedCollaborators = acceptedCollaborators.filter(
    (collaborator) =>
      String(collaborator.user_id) !== String(currentUser?.id),
  );
  const accepted = isOwner
    ? acceptedCollaborators
    : [
        ...(owner &&
        String(owner.user_id) !== String(currentUser?.id)
          ? [owner]
          : []),
        ...otherAcceptedCollaborators,
      ];
  const pending = collaborators.filter(
    (collaborator) => collaborator.status === "pending",
  );

  const handleInvite = async (event) => {
    event.preventDefault();
    try {
      setLocalError("");
      await onInvite(email.trim());
      setEmail("");
    } catch {
      // The collaboration hook displays the API error in this modal.
    }
  };

  const handleRemove = async (collaborator) => {
    const confirmed = await confirm({
      title: `Remove ${collaborator.name || collaborator.email}?`,
      description:
        "They will no longer be able to view or edit this trip, and will stop appearing as an active trip member. Their private AI conversations will remain in their account without this trip attached.",
      confirmLabel: "Remove access",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      setLocalError("");
      await onRemoveCollaborator(collaborator.user_id);
    } catch {
      // The collaboration hook displays the API error in this modal.
    }
  };

  const handleLeave = async () => {
    const confirmed = await confirm({
      title: `Leave “${trip.title}”?`,
      description:
        "You will lose access to this shared trip. Your private AI conversations will remain in your account without this trip attached.",
      confirmLabel: "Leave trip",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      setLeaving(true);
      setLocalError("");
      await leaveSharedTrip(trip.id);
      onLeftTrip();
    } catch (leaveError) {
      console.error("Error leaving shared trip:", leaveError);
      setLocalError(leaveError.message);
    } finally {
      setLeaving(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      setLocalError("");
      await onCancelInvitation(invitationId);
    } catch {
      // The collaboration hook displays the API error in this modal.
    }
  };

  return (
    <Modal
      title={isOwner ? "Share this trip" : "Trip collaborators"}
      subtitle={
        isOwner
          ? "Invite registered Planova users to plan and edit alongside you."
          : "See who is helping shape this shared adventure."
      }
      onClose={onClose}
    >
      <div className="collaboration-modal">
        <div className="collaboration-role-note">
          <span className="collaboration-role-icon">
            <Icon name={isOwner ? "sparkle" : "users"} size={19} />
          </span>
          <div>
            <strong>{isOwner ? "You own this trip" : "Shared with you"}</strong>
            <span>
              {isOwner
                ? "Only you can invite people or remove their access."
                : "You can edit trip details, plans, expenses, and members."}
            </span>
          </div>
        </div>

        {isOwner && (
          <form className="collaboration-invite-form" onSubmit={handleInvite}>
            <label htmlFor="collaborator-email">Invite by email</label>
            <div>
              <input
                id="collaborator-email"
                type="email"
                value={email}
                maxLength={320}
                required
                disabled={saving}
                placeholder="travel.friend@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving || !email.trim()}
              >
                <Icon name="plus" size={16} />
                Invite
              </button>
            </div>
            <small>
              They need an existing Planova account. Once accepted, they are
              added as a trip member automatically.
            </small>
          </form>
        )}

        {(error || localError) && (
          <p className="collaboration-alert is-error" role="alert">
            {error || localError}
          </p>
        )}
        {success && (
          <p className="collaboration-alert is-success" role="status">
            {success}
          </p>
        )}

        <section className="collaborator-section">
          <div className="collaborator-section-heading">
            <div>
              <h3>{isOwner ? "People with access" : "Other collaborators"}</h3>
              <span>
                {accepted.length} collaborator
                {accepted.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="collaborator-empty">
              <span className="trip-loading-dot" />
              Gathering your travel crew…
            </div>
          ) : accepted.length === 0 ? (
            <div className="collaborator-empty">
              <Icon name="users" size={24} />
              <strong>
                {isOwner ? "Just you for now" : "No other editors yet"}
              </strong>
              <span>
                {isOwner
                  ? "Invite someone above when you are ready to plan together."
                  : "The trip owner manages access to this trip."}
              </span>
            </div>
          ) : (
            <div className="collaborator-list">
              {accepted.map((collaborator) => {
                const isCurrentUser =
                  String(collaborator.user_id) === String(currentUser?.id);
                return (
                  <div
                    className="collaborator-row"
                    key={
                      collaborator.id ||
                      `${collaborator.role}-${collaborator.user_id}`
                    }
                  >
                    <span className="collaborator-avatar" aria-hidden="true">
                      {getInitials(collaborator.name, collaborator.email)}
                    </span>
                    <div className="collaborator-copy">
                      <strong>
                        {collaborator.name || collaborator.email}
                        {isCurrentUser ? " (you)" : ""}
                      </strong>
                      <span>{collaborator.email}</span>
                    </div>
                    <span className="collaborator-status is-accepted">
                      {collaborator.role === "owner" ? "Owner" : "Can edit"}
                    </span>
                    {isOwner && (
                      <button
                        className="collaborator-action"
                        type="button"
                        disabled={saving}
                        onClick={() => handleRemove(collaborator)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {isOwner && pending.length > 0 && (
          <section className="collaborator-section">
            <div className="collaborator-section-heading">
              <div>
                <h3>Pending invitations</h3>
                <span>Waiting for a response</span>
              </div>
            </div>
            <div className="collaborator-list">
              {pending.map((collaborator) => (
                <div className="collaborator-row" key={collaborator.id}>
                  <span className="collaborator-avatar is-pending" aria-hidden="true">
                    {getInitials(collaborator.name, collaborator.email)}
                  </span>
                  <div className="collaborator-copy">
                    <strong>{collaborator.name || collaborator.email}</strong>
                    <span>{collaborator.email}</span>
                  </div>
                  <span className="collaborator-status is-pending">Invited</span>
                  <button
                    className="collaborator-action"
                    type="button"
                    disabled={saving}
                    onClick={() => handleCancelInvitation(collaborator.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isOwner && (
          <div className="collaboration-leave">
            <div>
              <strong>Need to step away?</strong>
              <span>You can leave this shared trip at any time.</span>
            </div>
            <button
              className="btn btn-danger"
              type="button"
              disabled={saving || leaving}
              onClick={handleLeave}
            >
              {leaving ? "Leaving…" : "Leave trip"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CollaborationModal;

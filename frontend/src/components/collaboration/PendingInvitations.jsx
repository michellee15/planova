import Icon from "../ui/Icon";
import { formatDisplayDate } from "../../utils/preferences";

function PendingInvitations({
  invitations,
  loading,
  busyInvitationId,
  error,
  onAccept,
  onDecline,
}) {
  if (!loading && invitations.length === 0) return null;

  return (
    <section
      className="trip-invitations"
      aria-labelledby="trip-invitations-heading"
    >
      <div className="trip-invitations-heading">
        <span className="trip-invitations-icon">
          <Icon name="users" size={22} />
        </span>
        <div>
          <p className="page-eyebrow">Plan together</p>
          <h2 id="trip-invitations-heading">Trip invitations</h2>
          <p>Someone saved you a seat on their next adventure.</p>
        </div>
      </div>

      {error && <p className="collaboration-alert is-error">{error}</p>}

      {loading ? (
        <div className="invitation-loading">
          <span className="trip-loading-dot" />
          Checking for invitations…
        </div>
      ) : (
        <div className="invitation-list">
          {invitations.map((invitation) => {
            const isBusy =
              String(busyInvitationId) === String(invitation.id);

            return (
              <article className="invitation-card" key={invitation.id}>
                <span className="collaborator-avatar" aria-hidden="true">
                  {(invitation.invited_by_name || "P")
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className="invitation-copy">
                  <strong>{invitation.trip_title}</strong>
                  <span>
                    {invitation.invited_by_name || invitation.invited_by_email}{" "}
                    invited you to edit
                    {invitation.destination
                      ? ` a trip to ${invitation.destination}`
                      : " this trip"}
                    .
                  </span>
                  <small>Sent {formatDisplayDate(invitation.created_at)}</small>
                </div>
                <div className="invitation-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={isBusy}
                    onClick={() => onDecline(invitation)}
                  >
                    Decline
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={isBusy}
                    onClick={() => onAccept(invitation)}
                  >
                    <Icon name="check" size={16} />
                    {isBusy ? "Joining…" : "Join trip"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PendingInvitations;

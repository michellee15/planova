import Icon from "../ui/Icon";

function MemberItem({ member, handleDeleteMember }) {
  const isRegistered =
    member.member_type === "registered" || member.user_id != null;

  return (
    <article className={`member-item${isRegistered ? " is-registered" : ""}`}>
      <div className="member-item-profile">
        <span className="member-avatar" aria-hidden="true">
          {(member.name || "T").charAt(0).toUpperCase()}
        </span>
        <div>
          <h3>{member.name}</h3>
          <p>{isRegistered ? "Planova account · Added automatically" : "Guest traveller"}</p>
        </div>
      </div>
      {isRegistered ? (
        <span className="member-account-badge">
          <Icon name="check" size={14} />
          Account
        </span>
      ) : (
        <button
          className="member-delete-button"
          type="button"
          aria-label={`Remove ${member.name}`}
          onClick={() => handleDeleteMember(member.id)}
        >
          <Icon name="trash" size={16} />
        </button>
      )}
    </article>
  );
}

export default MemberItem;

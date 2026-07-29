import Icon from "../ui/Icon";

function MemberItem({ member, handleDeleteMember }) {
  return (
    <article className="member-item">
      <div className="member-item-profile">
        <span className="member-avatar">
          {(member.name || "T").charAt(0).toUpperCase()}
        </span>
        <div>
          <h3>{member.name}</h3>
          <p>Travel companion</p>
        </div>
      </div>
      <button
        className="member-delete-button"
        type="button"
        aria-label={`Remove ${member.name}`}
        onClick={() => handleDeleteMember(member.id)}
      >
        <Icon name="trash" size={16} />
      </button>
    </article>
  );
}

export default MemberItem;

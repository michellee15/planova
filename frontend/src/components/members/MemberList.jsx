import MemberItem from "./MemberItem";

function MemberList({members, loading, handleDeleteMember}) {
  if (loading) {
    return (
      <div className="members-empty-state" role="status">
        <span className="trip-loading-dot" />
        <div>
          <strong>Gathering your travel crew…</strong>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="members-empty-state">
        <span>♡</span>
        <div>
          <strong>No trip members yet</strong>
          <p>Add a guest or invite a collaborator to start sharing expenses.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="member-list">
      {members.map((member) => (
        <MemberItem
          key={member.id}
          member={member}
          handleDeleteMember={handleDeleteMember}
        />
      ))}
    </div>
  );
}

export default MemberList;

import MemberItem from "./MemberItem";

function MemberList({members, handleDeleteMember}) {
  if (members.length === 0) {
    return (
      <div className="members-empty-state">
        <span>♡</span>
        <div>
          <strong>No travel companions yet</strong>
          <p>Add someone above to start sharing expenses.</p>
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

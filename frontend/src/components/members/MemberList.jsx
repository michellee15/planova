import MemberItem from "./MemberItem";

function MemberList({members, handleDeleteMember}) {
  if (members.length === 0) {
    return <p>No members yet.</p>
  }
  return (
    <div>
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
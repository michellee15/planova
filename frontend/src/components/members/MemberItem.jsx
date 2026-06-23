function MemberItem({member, handleDeleteMember}) {
  return (
    <div>
      <p>{member.name}</p>
      <button
      type="button"
      onClick={() => handleDeleteMember(member.id)}
      >
        Delete
      </button>
    </div>
  );
}

export default MemberItem;

function MemberForm({memberFormData, handleMemberChange, handleCreateMember}) {
  return (
    <form onSubmit={handleCreateMember}>
      <input 
        type="text"
        name="name"
        value={memberFormData.name}
        onChange={handleMemberChange}
        placeholder="Member name"
      />
      <button type="submit">Add Member</button>
    </form>
  )
}

export default MemberForm;
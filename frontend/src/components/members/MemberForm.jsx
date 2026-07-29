import Icon from "../ui/Icon";

function MemberForm({
  memberFormData,
  handleMemberChange,
  handleCreateMember,
}) {
  return (
    <form className="member-form" onSubmit={handleCreateMember}>
      <div className="form-field">
        <label htmlFor="member-name">Who’s joining?</label>
        <input
          id="member-name"
          type="text"
          name="name"
          value={memberFormData.name}
          onChange={handleMemberChange}
          placeholder="Travel companion’s name"
          required
        />
      </div>
      <button className="btn btn-primary" type="submit">
        <Icon name="plus" size={17} />
        Add member
      </button>
    </form>
  );
}

export default MemberForm;

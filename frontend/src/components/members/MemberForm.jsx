import Icon from "../ui/Icon";

function MemberForm({
  memberFormData,
  handleMemberChange,
  handleCreateMember,
  saving,
  error,
}) {
  return (
    <div className="member-form-section">
      <form className="member-form" onSubmit={handleCreateMember}>
        <div className="form-field">
          <label htmlFor="member-name">Add a guest traveller</label>
          <input
            id="member-name"
            type="text"
            name="name"
            value={memberFormData.name}
            onChange={handleMemberChange}
            placeholder="Guest traveller’s name"
            disabled={saving}
            required
          />
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={saving || !memberFormData.name.trim()}
        >
          <Icon name="plus" size={17} />
          {saving ? "Adding…" : "Add guest"}
        </button>
      </form>
      <p className="member-form-help">
        <Icon name="users" size={16} />
        Planova collaborators are added here automatically once they accept an
        invitation.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default MemberForm;

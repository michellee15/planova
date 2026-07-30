import Icon from "../ui/Icon";
import { getDateRangeHelp } from "../../utils/dateRange";

function ExpenseForm({
  formData,
  onChange,
  onSubmit,
  members,
  onSplitMemberChange,
  dateRange,
  error,
}) {
  return (
    <form className="expense-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="expense-title">What was it?</label>
          <input
            id="expense-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="e.g. Dinner by the river"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="expense-amount">Amount</label>
          <input
            id="expense-amount"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={onChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="expense-category">Category</label>
          <select
            id="expense-category"
            name="category"
            value={formData.category}
            onChange={onChange}
          >
            <option value="">Choose a category</option>
            <option value="Food">Food</option>
            <option value="Drinks">Drinks</option>
            <option value="Groceries">Groceries</option>
            <option value="Shopping">Shopping</option>
            <option value="Others">Others</option>
          </select>
        </div>
        {formData.category === "Others" && (
          <div className="form-field">
            <label htmlFor="expense-custom-category">Custom category</label>
            <input
              id="expense-custom-category"
              type="text"
              name="custom_category"
              value={formData.custom_category}
              onChange={onChange}
              placeholder="Enter a category"
            />
          </div>
        )}
        <div className="form-field">
          <label htmlFor="expense-payer">Paid by</label>
          <select
            id="expense-payer"
            name="paid_by_member_id"
            value={formData.paid_by_member_id}
            onChange={onChange}
          >
            <option value="">Choose a member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="expense-date">Date</label>
          <input
            id="expense-date"
            type="date"
            name="expense_date"
            value={formData.expense_date}
            onChange={onChange}
            min={dateRange.startDate || undefined}
            max={dateRange.endDate || undefined}
            aria-describedby="expense-date-help"
            disabled={!dateRange.startDate || !dateRange.endDate}
          />
          <span className="form-help" id="expense-date-help">
            {getDateRangeHelp(dateRange)}
          </span>
        </div>
        <fieldset className="split-picker full-width">
          <legend>Split with</legend>
          {members.length === 0 ? (
            <p>Add trip members before splitting an expense.</p>
          ) : (
            members.map((member) => (
              <label key={member.id}>
                <input
                  type="checkbox"
                  value={member.id}
                  checked={(formData.split_member_ids || []).includes(
                    Number(member.id),
                  )}
                  onChange={onSplitMemberChange}
                />
                <span>{member.name}</span>
              </label>
            ))
          )}
        </fieldset>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          <Icon name="plus" size={17} />
          Add expense
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;

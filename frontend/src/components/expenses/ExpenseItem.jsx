import Icon from "../ui/Icon";
import { formatDisplayDate } from "../../utils/preferences";
import { getDateRangeHelp } from "../../utils/dateRange";

function ExpenseItem({
  expense,
  currency,
  members,
  isEditing,
  editFormData,
  onEditChange,
  onStartEditExpense,
  onEditExpense,
  onCancelEditExpense,
  onDeleteExpense,
  onEditSplitMemberChange,
  dateRange,
  editError,
}) {
  if (isEditing) {
    return (
      <article className="expense-item expense-item-editing">
        <div className="expense-edit-heading">
          <span>
            <Icon name="edit" size={19} />
          </span>
          <div>
            <p>Updating expense</p>
            <h3>Edit {expense.title}</h3>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor={`expense-title-${expense.id}`}>Expense name</label>
            <input
              id={`expense-title-${expense.id}`}
              type="text"
              name="title"
              value={editFormData.title}
              onChange={onEditChange}
              placeholder="Expense title"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`expense-amount-${expense.id}`}>Amount</label>
            <input
              id={`expense-amount-${expense.id}`}
              type="number"
              name="amount"
              value={editFormData.amount}
              onChange={onEditChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={`expense-category-${expense.id}`}>Category</label>
            <select
              id={`expense-category-${expense.id}`}
              name="category"
              value={editFormData.category}
              onChange={onEditChange}
            >
              <option value="">Choose a category</option>
              <option value="Food">Food</option>
              <option value="Shopping">Shopping</option>
              <option value="Groceries">Groceries</option>
              <option value="Drinks">Drinks</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {editFormData.category === "Others" && (
            <div className="form-field">
              <label htmlFor={`expense-custom-category-${expense.id}`}>
                Custom category
              </label>
              <input
                id={`expense-custom-category-${expense.id}`}
                type="text"
                name="custom_category"
                value={editFormData.custom_category || ""}
                onChange={onEditChange}
                placeholder="Enter a category"
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor={`expense-payer-${expense.id}`}>Paid by</label>
            <select
              id={`expense-payer-${expense.id}`}
              name="paid_by_member_id"
              value={editFormData.paid_by_member_id || ""}
              onChange={onEditChange}
            >
              <option value="">Choose a member</option>
              {(members || []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`expense-date-${expense.id}`}>Date</label>
            <input
              id={`expense-date-${expense.id}`}
              type="date"
              name="expense_date"
              value={editFormData.expense_date || ""}
              onChange={onEditChange}
              min={dateRange.startDate || undefined}
              max={dateRange.endDate || undefined}
              aria-describedby={`expense-date-help-${expense.id}`}
              disabled={!dateRange.startDate || !dateRange.endDate}
            />
            <span
              className="form-help"
              id={`expense-date-help-${expense.id}`}
            >
              {getDateRangeHelp(dateRange)}
            </span>
          </div>

          <fieldset className="split-picker full-width">
            <legend>Split with</legend>
            {(members || []).length === 0 ? (
              <p>Add trip members before splitting this expense.</p>
            ) : (
              members.map((member) => (
                <label key={member.id}>
                  <input
                    type="checkbox"
                    value={member.id}
                    checked={(editFormData.split_member_ids || []).includes(
                      Number(member.id),
                    )}
                    onChange={onEditSplitMemberChange}
                  />
                  <span>{member.name}</span>
                </label>
              ))
            )}
          </fieldset>
        </div>

        {editError && (
          <p className="form-error" role="alert">
            {editError}
          </p>
        )}

        <div className="expense-edit-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancelEditExpense}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => onEditExpense(expense.id)}
          >
            <Icon name="check" size={17} />
            Save changes
          </button>
        </div>
      </article>
    );
  }

  const category = expense.category || "Uncategorised";
  const categoryClass = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const splitMembers = expense.split_members || [];
  const formattedDate = formatDisplayDate(expense.expense_date);

  return (
    <article className={`expense-item expense-category-${categoryClass}`}>
      <div className="expense-item-main">
        <span className="expense-category-icon">
          <Icon name="expenses" size={20} />
        </span>

        <div className="expense-item-copy">
          <div className="expense-item-title-row">
            <div>
              <span className="expense-category-badge">{category}</span>
              <h3>{expense.title}</h3>
            </div>
            <strong className="expense-amount">
              <small>{currency}</small>
              {Number(expense.amount).toFixed(2)}
            </strong>
          </div>

          <div className="expense-meta">
            {expense.paid_by_member_id && (
              <span>
                <Icon name="wallet" size={15} />
                Paid by <strong>{expense.payer_name || "Unknown"}</strong>
              </span>
            )}
            {formattedDate && (
              <span>
                <Icon name="calendar" size={15} />
                {formattedDate}
              </span>
            )}
          </div>

          <div className="expense-split-row">
            <span className="expense-split-label">
              <Icon name="users" size={15} />
              Split with
            </span>
            <div className="expense-member-chips">
              {splitMembers.length > 0 ? (
                splitMembers.map((member) => (
                  <span key={member.id || member.name}>
                    <i>{(member.name || "?").charAt(0).toUpperCase()}</i>
                    {member.name}
                  </span>
                ))
              ) : (
                <span className="expense-no-split">No split members</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="expense-item-actions">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onStartEditExpense(expense)}
        >
          <Icon name="edit" size={16} />
          Edit
        </button>
        <button
          className="expense-delete-button"
          type="button"
          aria-label={`Delete ${expense.title}`}
          onClick={() => onDeleteExpense(expense.id)}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </article>
  );
}

export default ExpenseItem;

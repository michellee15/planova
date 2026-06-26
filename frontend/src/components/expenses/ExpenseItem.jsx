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
  onEditSplitMemberChange
}) {
  if (isEditing) {
    return (
      <article>
        <input
          type="text"
          name="title"
          value={editFormData.title}
          onChange={onEditChange}
          placeholder="Expense title"
        />
        <input
          type="number"
          name="amount"
          value={editFormData.amount}
          onChange={onEditChange}
          placeholder="Amount"
          step="0.01"
        />
        <select
          name="category"
          value={editFormData.category}
          onChange={onEditChange}
        >
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Shopping">Shopping</option>
          <option value="Groceries">Groceries</option>
          <option value="Drinks">Drinks</option>
          <option value="Others">Others</option>
        </select>
        {editFormData.category === "Others" && (
          <input
            type="text"
            name="custom_category"
            value={editFormData.custom_category}
            onChange={onEditChange}
            placeholder="Enter category"
          />
        )}

          <select
            name="paid_by_member_id"
            value={editFormData.paid_by_member_id}
            onChange={onEditChange}
          >
            <option value="">Select member</option>
            {(members || []).map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          <fieldset>
            <legend>Split with</legend>
            {(members || []).map((member) => (
              <label key={member.id}>
                <input
                  type="checkbox"
                  value={member.id}
                  checked={(editFormData.split_member_ids || []).includes(Number(member.id))}
                  onChange={onEditSplitMemberChange}
                />
                {member.name}
              </label>
            ))}
        </fieldset>

        <input
          type="date"
          name="expense_date"
          value={editFormData.expense_date}
          onChange={onEditChange}
        />

        <button type="button" onClick={() => onEditExpense(expense.id)}>
          Save
        </button>
        <button type="button" onClick={onCancelEditExpense}>
          Cancel
        </button>
      </article>
    );
  }

  return (
    <article>
      <h3>{expense.title}</h3>
      <p>{currency} {Number(expense.amount).toFixed(2)}</p>
      {expense.category && <p>Category: {expense.category}</p>}
      {expense.paid_by_member_id && <p>Paid by: {expense.payer_name || "Unknown"}</p>}
      <p>
        Split with: {" "}
        {expense.split_members && expense.split_members.length > 0 
          ? expense.split_members.map((member) => member.name).join(", ")
          : "No split members"}
      </p>
      {expense.expense_date && (
        <p>Date: {expense.expense_date.slice(0, 10)}</p>
      )}

      <button type="button" onClick={() => onStartEditExpense(expense)}>
        Edit
      </button>
      <button type="button" onClick={() => onDeleteExpense(expense.id)}>
        Delete
      </button>
    </article>
  );
}

export default ExpenseItem;
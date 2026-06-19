function ExpenseItem({
  expense,
  currency,
  isEditing,
  editFormData,
  onEditChange,
  onStartEditExpense,
  onEditExpense,
  onCancelEditExpense,
  onDeleteExpense,
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
        <input
          type="text"
          name="paid_by"
          value={editFormData.paid_by}
          onChange={onEditChange}
          placeholder="Paid by"
        />
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
      {expense.paid_by && <p>Paid by: {expense.paid_by}</p>}
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
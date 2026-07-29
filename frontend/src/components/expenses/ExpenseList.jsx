import ExpenseItem from "./ExpenseItem";

function ExpenseList({
  expenses,
  currency,
  members,
  editingExpenseId,
  editFormData,
  onEditChange,
  onStartEditExpense,
  onEditExpense,
  onCancelEditExpense,
  onDeleteExpense,
  onEditSplitMemberChange,
}) {
  if (expenses.length === 0) {
    return <p className="empty-state">No expenses yet—your first one will appear here.</p>;
  }

  return (
    <div className="expense-list">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          currency={currency}
          members={members}
          isEditing={String(editingExpenseId) === String(expense.id)}
          editFormData={editFormData}
          onEditChange={onEditChange}
          onStartEditExpense={onStartEditExpense}
          onEditExpense={onEditExpense}
          onCancelEditExpense={onCancelEditExpense}
          onDeleteExpense={onDeleteExpense}
          onEditSplitMemberChange={onEditSplitMemberChange}
        />
      ))}
    </div>
  );
}

export default ExpenseList;

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
}) {
  if (expenses.length === 0) {
    return <p>No expenses yet.</p>;
  }

  return (
    <div>
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
        />
      ))}
    </div>
  );
}

export default ExpenseList;
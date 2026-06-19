import ExpenseItem from "./ExpenseItem";

function ExpenseList({expenses, currency, onDeleteExpense}) {
  if (expenses.length === 0) return <p>No expenses yet.</p>
  return (
    <div>
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          currency={currency}
          onDeleteExpense={onDeleteExpense}
        />
      ))}
    </div>
  )
}

export default ExpenseList;
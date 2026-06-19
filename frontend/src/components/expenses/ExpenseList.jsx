import ExpenseItem from "./ExpenseItem";

function ExpenseList({expenses, currency}) {
  if (expenses.length === 0) return <p>No expenses yet.</p>
  return (
    <div>
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          currency={currency}
        />
      ))}
    </div>
  )
}

export default ExpenseList;
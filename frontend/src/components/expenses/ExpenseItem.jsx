//displays only one expense 
function ExpenseItem({expense, currency, onDeleteExpense}) {
  return (
    <article>
      <h3>{expense.title}</h3>
      <p>{currency}{Number(expense.amount).toFixed(2)}</p>
      {expense.category && <p>Category: {expense.category}</p>}
      {expense.paid_by && <p>Paid by: {expense.paid_by}</p>}
      {expense.expense_date && (<p>Date: {expense.expense_date.slice(0,10)}</p>)}

      <button type ="button" onClick={() => onDeleteExpense(expense.id)}>
        Delete
      </button>
    </article>
  )
}

export default ExpenseItem;
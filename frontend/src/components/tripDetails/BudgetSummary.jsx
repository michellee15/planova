function BudgetSummary({trip, expenses = []}) {
  const totalBudget = Number(trip.total_budget) || 0;
  const totalSpent = (expenses || []).reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);
  const remaining = totalBudget - totalSpent;
  const budgetUsed = totalBudget > 0 ? Math.round((totalSpent/totalBudget) * 100) : 0;

  return (
    <section>
      <h2>Budget Summary</h2>
      <div>
        <h3>Total Budget</h3>
        <p>{trip.currency} {totalBudget.toFixed(2)}</p>
      </div>
      <div>
        <h3>Total Spent</h3>
        <p>{trip.currency} {totalSpent.toFixed(2)}</p>
      </div>
      <div>
        <h3>Remaining</h3>
        <p>{trip.currency} {remaining.toFixed(2)}</p>
      </div>
      <div>
        <h3>Budget Used</h3>
        <p>{budgetUsed}%</p>
      </div>
      {remaining < 0 && (
        <p>You are over budget by {trip.currency}{Math.abs(remaining).toFixed(2)}.</p>
      )}
    </section>
  );
}

export default BudgetSummary;
import Icon from "../ui/Icon";

function BudgetSummary({ trip, expenses = [] }) {
  const totalBudget = Number(trip.total_budget) || 0;
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const remaining = totalBudget - totalSpent;
  const budgetUsed =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const ringProgress = Math.min(Math.max(budgetUsed, 0), 100) * 3.6;
  const currency = trip.currency || "SGD";

  return (
    <section className="dashboard-card budget-card">
      <div className="dashboard-card-header">
        <div>
          <p className="dashboard-card-eyebrow">Money check-in</p>
          <h2>Budget summary</h2>
        </div>
        <span className="dashboard-card-icon dashboard-card-icon-peach">
          <Icon name="wallet" size={20} />
        </span>
      </div>

      <div className="budget-content">
        <div
          className="budget-ring"
          style={{ "--budget-progress": `${ringProgress}deg` }}
        >
          <div className="budget-ring-inner">
            <strong>{budgetUsed}%</strong>
            <span>used</span>
          </div>
        </div>

        <div className="budget-details">
          <div className="budget-row">
            <div><span className="budget-dot budget-dot-total" />Budget</div>
            <strong>{currency} {totalBudget.toFixed(2)}</strong>
          </div>
          <div className="budget-row">
            <div><span className="budget-dot budget-dot-spent" />Spent</div>
            <strong>{currency} {totalSpent.toFixed(2)}</strong>
          </div>
          <div className="budget-row">
            <div><span className="budget-dot budget-dot-remaining" />Remaining</div>
            <strong className={remaining < 0 ? "budget-negative" : ""}>
              {currency} {remaining.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      <p className={`budget-message${remaining < 0 ? " budget-message-danger" : ""}`}>
        {totalBudget === 0
          ? "Set a trip budget to see your spending progress here."
          : remaining < 0
            ? `You’re ${currency} ${Math.abs(remaining).toFixed(2)} over budget.`
            : "Looking good—your travel fund is on track."}
      </p>
    </section>
  );
}

export default BudgetSummary;

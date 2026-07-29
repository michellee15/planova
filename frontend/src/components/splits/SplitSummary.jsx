import Icon from "../ui/Icon";

function SplitSummary({
  balances,
  settlements,
  currency,
  onCreateSettlement,
  savingSettlement,
}) {
  return (
    <section className="settlement-card">
      <div className="settlement-heading">
        <span><Icon name="wallet" size={19} /></span>
        <div>
          <p>Who owes what</p>
          <h2>Payment summary</h2>
        </div>
      </div>

      <div className="balance-list">
        {balances.length === 0 ? (
          <p className="empty-state">Add members to calculate balances.</p>
        ) : (
          balances.map((member) => (
            <div key={member.member_id}>
              <span>{member.name}</span>
              <strong className={member.balance < 0 ? "negative" : ""}>
                {currency} {member.balance.toFixed(2)}
              </strong>
            </div>
          ))
        )}
      </div>

      <h3 className="settlement-subheading">Suggested settlements</h3>
      {settlements.length === 0 ? (
        <p className="settled-message">
          <Icon name="check" size={17} />
          Everyone is settled.
        </p>
      ) : (
        <div className="settlement-list">
          {settlements.map((settlement, index) => (
            <div key={`${settlement.from_member_id}-${settlement.to_member_id}-${index}`}>
              <p>
                <strong>{settlement.from_member_name}</strong> owes{" "}
                <strong>{settlement.to_member_name}</strong>
                <span>{currency} {settlement.amount.toFixed(2)}</span>
              </p>
              <button
                className="btn btn-soft"
                type="button"
                disabled={savingSettlement}
                onClick={() =>
                  onCreateSettlement({
                    from_member_id: settlement.from_member_id,
                    to_member_id: settlement.to_member_id,
                    amount: settlement.amount,
                  })
                }
              >
                {savingSettlement ? "Saving…" : "Mark paid"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SplitSummary;

import Icon from "../ui/Icon";

function SettlementHistory({
  settlementPayments,
  currency,
  onUndoSettlement,
}) {
  return (
    <section className="settlement-card">
      <div className="settlement-heading settlement-heading-mint">
        <span><Icon name="check" size={19} /></span>
        <div>
          <p>Already paid</p>
          <h2>Settlement history</h2>
        </div>
      </div>
      {settlementPayments.length === 0 ? (
        <p className="empty-state">Completed payments will appear here.</p>
      ) : (
        <div className="settlement-history-list">
          {settlementPayments.map((payment) => (
            <div key={payment.id}>
              <p>
                <strong>{payment.from_member_name}</strong> paid{" "}
                <strong>{payment.to_member_name}</strong>
                <span>{currency} {Number(payment.amount).toFixed(2)}</span>
              </p>
              <button type="button" onClick={() => onUndoSettlement(payment.id)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SettlementHistory;

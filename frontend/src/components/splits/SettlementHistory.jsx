function SettlementHistory({settlementPayments, currency}) {
  return (
    <section>
      <h2>Settlement History</h2>
      {settlementPayments.length === 0 ? (
        <p> No settlement payments yet.</p>
      ) : (
        settlementPayments.map((payment) => (
          <p key={payment.id}>
            {payment.from_member_name} paid {payment.to_member_name}{" "}
            {currency} {Number(payment.amount).toFixed(2)}
          </p>
        ))
      )}
    </section>
  );
}

export default SettlementHistory;
function SplitSummary({balances, settlements, currency}) {
  return (
    <section>
      <h2>Split Summary</h2>
      <h3>Balances</h3>
      {balances.map((member) => (
        <p key={member.member_id}>
          {member.name}: {currency}{member.balance.toFixed(2)}
        </p>
      ))}
      <h3>Summary</h3>
      {settlements.length === 0 ? (
        <p>Everyone is settled.</p>
      ) : (
        settlements.map((settlement, index) => (
          <p key={index}>
            {settlement.from_member_name} owes {settlement.to_member_name} {" "}
            {currency} {settlement.amount.toFixed(2)}
          </p>
        ))
      )}
    </section>
  )
}

export default SplitSummary;
export function calculateBalances(members, expenses) {
  const balances = {};
  members.forEach((member) => {
    balances[Number(member.id)] = {
      member_id: Number(member.id),
      name: member.name,
      paid: 0,
      owes: 0,
      balance: 0,
    };
  });
  expenses.forEach((expense) => {
    const amount = Number(expense.amount);
    const payerId = Number(expense.paid_by_member_id);
    const splitMembers = expense.split_members || [];

    if (!amount || !payerId || splitMembers.length === 0) return;
    const share = amount / splitMembers.length;
    if (balances[payerId]) {
      balances[payerId].paid += amount;
    }
    splitMembers.forEach((member) => {
      const memberId = Number(member.id);

      if (balances[memberId]) {
        balances[memberId].owes += share;
      }
    });
  });
  Object.values(balances).forEach((memberBalance) => {
    memberBalance.balance = memberBalance.paid - memberBalance.owes;
  });

  return Object.values(balances);
}

export function calculateSettlements(balances) {
  const peopleWhoOwe = [];
  const peopleToReceive = [];

  balances.forEach((member) => {
    const roundedBalance = Math.round(member.balance * 100) / 100;

    if (roundedBalance < 0) {
      peopleWhoOwe.push({
        ...member,
        amount: Math.abs(roundedBalance),
      });
    }

    if (roundedBalance > 0) {
      peopleToReceive.push({
        ...member,
        amount: roundedBalance,
      });
    }
  });

  const settlements = [];
  let oweIdx = 0;
  let receiveIdx = 0;
  while (
    oweIdx < peopleWhoOwe.length &&
    receiveIdx < peopleToReceive.length
  ) {
    const personWhoOwes = peopleWhoOwe[oweIdx];
    const personToReceive = peopleToReceive[receiveIdx];
    const amount = Math.min(personWhoOwes.amount, personToReceive.amount);
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) {
      settlements.push({
        from_member_id: personWhoOwes.member_id,
        from_member_name: personWhoOwes.name,
        to_member_id: personToReceive.member_id,
        to_member_name: personToReceive.name,
        amount: rounded,
      });
    }
    personWhoOwes.amount -= amount;
    personToReceive.amount -= amount;

    if (personWhoOwes.amount < 0.01) oweIdx++;
    if (personToReceive.amount < 0.01) receiveIdx++;
  }
  return settlements;
}
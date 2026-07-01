const pool = require("../config/db");

const getSettlementByTripId = async (tripId) => {
  const result = await pool.query(
    `SELECT sp.id,
    sp.trip_id, sp.from_member_id, from_member.name AS from_member_name,
    sp.to_member_id, to_member.name AS to_member_name,
    sp.amount, sp.paid_at
    FROM settlement_payments sp
    JOIN trip_members from_member ON sp.from_member_id = from_member.id
    JOIN trip_members to_member ON sp.to_member_id = to_member.id
    WHERE sp.trip_id = $1
    ORDER BY sp.paid_at DESC`,
    [tripId]
  );
  return result.rows;
};

const createSettlement = async (data) => {
  const {trip_id, from_member_id, to_member_id, amount} = data;
  const result = await pool.query(
    `INSERT INTO settlement_payments
     (trip_id, from_member_id, to_member_id, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
     [trip_id, from_member_id, to_member_id, amount]
  );
  return result.rows[0];
};

module.exports = {
  getSettlementByTripId,
  createSettlement,
}
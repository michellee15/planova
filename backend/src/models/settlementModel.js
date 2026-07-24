const pool = require("../config/db");

const getSettlementByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT sp.id,
    sp.trip_id, sp.from_member_id, from_member.name AS from_member_name,
    sp.to_member_id, to_member.name AS to_member_name,
    sp.amount, sp.paid_at
    FROM settlement_payments sp
    JOIN trips t ON sp.trip_id = t.id
    JOIN trip_members from_member ON sp.from_member_id = from_member.id
    JOIN trip_members to_member ON sp.to_member_id = to_member.id
    WHERE sp.trip_id = $1
      AND t.user_id = $2
    ORDER BY sp.paid_at DESC`,
    [tripId, user_id]
  );
  return result.rows;
};

const createSettlement = async (data) => {
  const {user_id, trip_id, from_member_id, to_member_id, amount} = data;
  const tripCheck = await pool.query(
    `SELECT id
     FROM trips
     WHERE id = $1
      AND user_id = $2`,
    [trip_id, user_id]
  );
  if (tripCheck.rows.length === 0) return null;
  const result = await pool.query(
    `INSERT INTO settlement_payments
     (trip_id, from_member_id, to_member_id, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
     [trip_id, from_member_id, to_member_id, amount]
  );
  return result.rows[0];
};

const deleteSettlement = async (id, user_id) => {
  const result = await pool.query(
    `DELETE FROM settlement_payments sp
     USING trips t
     WHERE sp.id = $1
      AND t.user_id = $2
      AND sp.trip_id = t.id
     RETURNING sp.*`, [id, user_id]
  );
  return result.rows[0];
};

module.exports = {
  getSettlementByTripId,
  createSettlement,
  deleteSettlement,
}
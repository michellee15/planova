const pool = require("../config/db");

const getMembersByTripId = async (tripId) => {
  const result = await pool.query(
    `SELECT * FROM trip_members WHERE trip_id = $1 ORDER BY created_at DESC`,
    [tripId]
  );
  return result.rows;
};

const createMember = async (data) => {
  const {trip_id, name} = data;
  const result = await pool.query(
    `INSERT INTO trip_members (trip_id, name)
     VALUES ($1, $2)
     RETURNING *`,[trip_id, name]
  );
  return result.rows[0];
};

const deleteMember = async (id) => {
  const result = await pool.query(
    `DELETE FROM trip_members WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getMembersByTripId,
  createMember,
  deleteMember,
};
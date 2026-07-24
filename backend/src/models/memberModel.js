const pool = require("../config/db");

const getMembersByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT * 
     FROM trip_members 
     WHERE trip_id = $1 
      AND user_id = $2
     ORDER BY created_at DESC`,
    [tripId, user_id]
  );
  return result.rows;
};

const createMember = async (data) => {
  const {user_id, trip_id, name} = data;
  const result = await pool.query(
    `INSERT INTO trip_members (user_id, trip_id, name)
     VALUES ($1, $2, $3)
     RETURNING *`,[user_id, trip_id, name]
  );
  return result.rows[0];
};

const deleteMember = async (id, user_id) => {
  const result = await pool.query(
    `DELETE FROM trip_members WHERE id = $1 AND user_id = $2 RETURNING trip_id`,
    [id, user_id]
  );
  return result.rows[0];
};

module.exports = {
  getMembersByTripId,
  createMember,
  deleteMember,
};
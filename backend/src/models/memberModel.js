const pool = require("../config/db");

const getMembersByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT tm.* 
     FROM trip_members tm
     JOIN trips t ON tm.trip_id = t.id
     WHERE tm.trip_id = $1 
      AND t.user_id = $2
     ORDER BY created_at DESC`,
    [tripId, user_id]
  );
  return result.rows;
};

const createMember = async (data) => {
  const {user_id, trip_id, name} = data;
  const tripCheck = await pool.query(
    `SELECT id
     FROM trips 
     WHERE id = $1
      AND user_id = $2`,
    [trip_id, user_id]
  );
  if (tripCheck.rows.length === 0) return null;
  const result = await pool.query(
    `INSERT INTO trip_members (trip_id, name)
     VALUES ($1, $2)
     RETURNING *`,[trip_id, name]
  );
  return result.rows[0];
};

const deleteMember = async (id, user_id) => {
  const result = await pool.query(
    `DELETE FROM trip_members tm
     USING trips t
     WHERE tm.trip_id = t.id
      AND tm.id = $1 
      AND t.user_id = $2 
      RETURNING tm.*`,
    [id, user_id]
  );
  return result.rows[0];
};

module.exports = {
  getMembersByTripId,
  createMember,
  deleteMember,
};
const pool = require("../config/db");

const syncTripPeopleCount = async (client, tripId) => {
  await client.query(
    `UPDATE trips t
     SET num_of_people = (
       SELECT COUNT(*)::integer
       FROM trip_members tm
       WHERE tm.trip_id = t.id
        AND (
          tm.user_id IS NULL
          OR tm.user_id = t.user_id
          OR EXISTS (
            SELECT 1
            FROM trip_collaborators active_collaborator
            WHERE active_collaborator.trip_id = t.id
             AND active_collaborator.user_id = tm.user_id
             AND active_collaborator.status = 'accepted'
          )
        )
     )
     WHERE t.id = $1`,
    [tripId]
  );
};

const getMembersByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT tm.id,
      tm.trip_id,
      COALESCE(u.name, tm.name) AS name,
      tm.user_id,
      tm.created_at,
      CASE
        WHEN tm.user_id IS NULL THEN 'guest'
        ELSE 'registered'
      END AS member_type
     FROM trip_members tm
     JOIN trips t ON tm.trip_id = t.id
     LEFT JOIN users u ON u.id = tm.user_id
     WHERE tm.trip_id = $1
      AND (
        t.user_id = $2
        OR EXISTS (
          SELECT 1
          FROM trip_collaborators tc
          WHERE tc.trip_id = t.id
           AND tc.user_id = $2
           AND tc.status = 'accepted'
        )
      )
      AND (
        tm.user_id IS NULL
        OR tm.user_id = t.user_id
        OR EXISTS (
          SELECT 1
          FROM trip_collaborators active_collaborator
          WHERE active_collaborator.trip_id = t.id
           AND active_collaborator.user_id = tm.user_id
           AND active_collaborator.status = 'accepted'
        )
      )
     ORDER BY tm.created_at DESC`,
    [tripId, user_id]
  );
  return result.rows;
};

const createMember = async (data) => {
  const {user_id, trip_id, name} = data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tripCheck = await client.query(
      `SELECT id
       FROM trips
       WHERE id = $1
        AND (
          user_id = $2
          OR EXISTS (
            SELECT 1
            FROM trip_collaborators tc
            WHERE tc.trip_id = trips.id
             AND tc.user_id = $2
             AND tc.status = 'accepted'
          )
        )
       FOR UPDATE`,
      [trip_id, user_id]
    );
    if (tripCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const result = await client.query(
      `INSERT INTO trip_members (trip_id, name, user_id)
       VALUES ($1, $2, NULL)
       RETURNING *`,
      [trip_id, name]
    );
    await syncTripPeopleCount(client, trip_id);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteMember = async (id, user_id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const targetResult = await client.query(
      `SELECT tm.*
       FROM trip_members tm
       JOIN trips t ON tm.trip_id = t.id
       WHERE tm.id = $1
        AND (
          t.user_id = $2
          OR EXISTS (
            SELECT 1
            FROM trip_collaborators tc
            WHERE tc.trip_id = t.id
             AND tc.user_id = $2
             AND tc.status = 'accepted'
          )
        )
        AND (
          tm.user_id IS NULL
          OR tm.user_id = t.user_id
          OR EXISTS (
            SELECT 1
            FROM trip_collaborators active_collaborator
            WHERE active_collaborator.trip_id = t.id
             AND active_collaborator.user_id = tm.user_id
             AND active_collaborator.status = 'accepted'
          )
        )
       FOR UPDATE OF tm`,
      [id, user_id]
    );
    const member = targetResult.rows[0];
    if (!member) {
      await client.query("ROLLBACK");
      return null;
    }
    if (member.user_id !== null && member.user_id !== undefined) {
      await client.query("ROLLBACK");
      return { protected: true, member };
    }

    const result = await client.query(
      `DELETE FROM trip_members
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    const deletedMember = result.rows[0];
    await syncTripPeopleCount(client, deletedMember.trip_id);
    await client.query("COMMIT");
    return { protected: false, member: deletedMember };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getMembersByTripId,
  createMember,
  deleteMember,
};

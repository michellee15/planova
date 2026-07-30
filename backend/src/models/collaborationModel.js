const pool = require("../config/db");

const getTripAccess = async (tripId, userId) => {
  const result = await pool.query(
    `SELECT CASE
       WHEN t.user_id = $2 THEN 'owner'
       ELSE 'editor'
     END AS access_role
     FROM trips t
     LEFT JOIN trip_collaborators tc
       ON tc.trip_id = t.id
      AND tc.user_id = $2
      AND tc.status = 'accepted'
     WHERE t.id = $1
      AND (t.user_id = $2 OR tc.id IS NOT NULL)`,
    [tripId, userId]
  );
  return result.rows[0]?.access_role || null;
};

const getTripOwner = async (tripId) => {
  const result = await pool.query(
    `SELECT u.id AS user_id,
      u.name,
      u.email,
      'owner' AS role
     FROM trips t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [tripId]
  );
  return result.rows[0] || null;
};

const createInvitation = async ({ tripId, ownerUserId, invitedUserId }) => {
  const result = await pool.query(
    `INSERT INTO trip_collaborators
      (trip_id, user_id, invited_by_user_id, status)
     SELECT t.id, $2, $1, 'pending'
     FROM trips t
     WHERE t.id = $3
      AND t.user_id = $1
      AND t.user_id <> $2
     RETURNING id, trip_id, user_id, status, created_at`,
    [ownerUserId, invitedUserId, tripId]
  );
  return result.rows[0];
};

const getPendingInvitations = async (userId) => {
  const result = await pool.query(
    `SELECT tc.id,
      tc.trip_id,
      tc.status,
      tc.created_at,
      t.title AS trip_title,
      t.destination,
      inviter.id AS invited_by_user_id,
      inviter.name AS invited_by_name,
      inviter.email AS invited_by_email
     FROM trip_collaborators tc
     JOIN trips t ON tc.trip_id = t.id
     JOIN users inviter ON tc.invited_by_user_id = inviter.id
     WHERE tc.user_id = $1
      AND tc.status = 'pending'
     ORDER BY tc.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const acceptInvitation = async (invitationId, userId) => {
  const result = await pool.query(
    `UPDATE trip_collaborators
     SET status = 'accepted',
      accepted_at = NOW()
     WHERE id = $1
      AND user_id = $2
      AND status = 'pending'
     RETURNING id, trip_id, user_id, status, created_at, accepted_at`,
    [invitationId, userId]
  );
  return result.rows[0];
};

const declineInvitation = async (invitationId, userId) => {
  const result = await pool.query(
    `DELETE FROM trip_collaborators
     WHERE id = $1
      AND user_id = $2
      AND status = 'pending'
     RETURNING id`,
    [invitationId, userId]
  );
  return result.rows[0];
};

const getCollaborators = async (tripId, includePending = false) => {
  const result = await pool.query(
    `SELECT tc.id,
      tc.user_id,
      u.name,
      u.email,
      tc.status,
      tc.created_at AS invited_at,
      tc.accepted_at
     FROM trip_collaborators tc
     JOIN users u ON tc.user_id = u.id
     WHERE tc.trip_id = $1
      AND ($2 OR tc.status = 'accepted')
     ORDER BY tc.created_at ASC`,
    [tripId, includePending]
  );
  return result.rows;
};

const cancelInvitation = async (tripId, invitationId, ownerUserId) => {
  const result = await pool.query(
    `DELETE FROM trip_collaborators tc
     USING trips t
     WHERE tc.trip_id = t.id
      AND tc.trip_id = $1
      AND tc.id = $2
      AND t.user_id = $3
      AND tc.status = 'pending'
     RETURNING tc.id`,
    [tripId, invitationId, ownerUserId]
  );
  return result.rows[0];
};

const removeCollaborator = async (tripId, collaboratorUserId, ownerUserId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `DELETE FROM trip_collaborators tc
       USING trips t
       WHERE tc.trip_id = t.id
        AND tc.trip_id = $1
        AND tc.user_id = $2
        AND t.user_id = $3
        AND tc.status = 'accepted'
       RETURNING tc.id, tc.user_id`,
      [tripId, collaboratorUserId, ownerUserId]
    );
    const removed = result.rows[0];
    if (!removed) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `UPDATE chat_sessions
       SET trip_id = NULL
       WHERE trip_id = $1
        AND user_id = $2`,
      [tripId, collaboratorUserId]
    );
    await client.query("COMMIT");
    return removed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const leaveTrip = async (tripId, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `DELETE FROM trip_collaborators
       WHERE trip_id = $1
        AND user_id = $2
        AND status = 'accepted'
       RETURNING id`,
      [tripId, userId]
    );
    const removed = result.rows[0];
    if (!removed) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `UPDATE chat_sessions
       SET trip_id = NULL
       WHERE trip_id = $1
        AND user_id = $2`,
      [tripId, userId]
    );
    await client.query("COMMIT");
    return removed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getTripAccess,
  getTripOwner,
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getCollaborators,
  cancelInvitation,
  removeCollaborator,
  leaveTrip,
};

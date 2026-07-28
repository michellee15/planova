const pool = require("../config/db");

const createSession = async ({ userId, tripId = null, title = null }) => {
  if (tripId !== null) {
    const tripResult = await pool.query(
      `SELECT id
       FROM trips
       WHERE id = $1
        AND user_id = $2`,
      [tripId, userId]
    );
    if (tripResult.rows.length === 0) return null;
  }

  const result = await pool.query(
    `INSERT INTO chat_sessions (user_id, trip_id, title)
     VALUES ($1, $2, $3)
     RETURNING id, trip_id, title, created_at, updated_at`,
    [userId, tripId, title || "New conversation"]
  );
  return result.rows[0];
};

const getSessionsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT cs.id,
      cs.trip_id,
      cs.title,
      cs.created_at,
      cs.updated_at,
      t.title AS trip_title
     FROM chat_sessions cs
     LEFT JOIN trips t ON cs.trip_id = t.id
     WHERE cs.user_id = $1
     ORDER BY cs.updated_at DESC`,
    [userId]
  );
  return result.rows;
};

const getSessionById = async (sessionId, userId) => {
  const result = await pool.query(
    `SELECT cs.id,
      cs.user_id,
      cs.trip_id,
      cs.title,
      cs.created_at,
      cs.updated_at,
      t.title AS trip_title,
      t.destination,
      t.start_date::text AS start_date,
      t.end_date::text AS end_date,
      t.total_budget,
      t.currency,
      t.num_of_people
     FROM chat_sessions cs
     LEFT JOIN trips t ON cs.trip_id = t.id
     WHERE cs.id = $1
      AND cs.user_id = $2`,
    [sessionId, userId]
  );
  return result.rows[0];
};

const getMessagesBySessionId = async (sessionId, userId, limit = 50) => {
  const result = await pool.query(
    `SELECT recent.id,
      recent.role,
      recent.content,
      recent.response_data,
      recent.created_at
     FROM (
       SELECT cm.id,
        cm.role,
        cm.content,
        cm.response_data,
        cm.created_at
       FROM chat_messages cm
       JOIN chat_sessions cs ON cm.session_id = cs.id
       WHERE cm.session_id = $1
        AND cs.user_id = $2
       ORDER BY cm.created_at DESC, cm.id DESC
       LIMIT $3
     ) recent
     ORDER BY recent.created_at ASC, recent.id ASC`,
    [sessionId, userId, limit]
  );
  return result.rows;
};

const saveExchange = async ({
  sessionId,
  userId,
  userMessage,
  assistantMessage,
  responseData,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query(
      `SELECT id, title
       FROM chat_sessions
       WHERE id = $1
        AND user_id = $2
       FOR UPDATE`,
      [sessionId, userId]
    );
    if (sessionResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'user', $2)`,
      [sessionId, userMessage]
    );
    const assistantResult = await client.query(
      `INSERT INTO chat_messages (session_id, role, content, response_data)
       VALUES ($1, 'assistant', $2, $3)
       RETURNING id, role, content, response_data, created_at`,
      [sessionId, assistantMessage, responseData]
    );
    const currentTitle = sessionResult.rows[0].title;
    const nextTitle =
      currentTitle === "New conversation"
        ? userMessage.trim().slice(0, 80)
        : currentTitle;
    await client.query(
      `UPDATE chat_sessions
       SET title = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [nextTitle, sessionId]
    );
    await client.query("COMMIT");
    return assistantResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteSession = async (sessionId, userId) => {
  const result = await pool.query(
    `DELETE FROM chat_sessions
     WHERE id = $1
      AND user_id = $2
     RETURNING id`,
    [sessionId, userId]
  );
  return result.rows[0];
};

module.exports = {
  createSession,
  getSessionsByUserId,
  getSessionById,
  getMessagesBySessionId,
  saveExchange,
  deleteSession,
};

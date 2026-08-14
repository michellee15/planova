const pool = require("../config/db");

const getAllTrips = async (user_id) => {
  const result = await pool.query(
    `SELECT
     id,
     title,
     destination,
     start_date::text AS start_date,
     end_date::text AS end_date,
     total_budget,
     currency,
     num_of_people,
     created_at,
     CASE
       WHEN t.user_id = $1 THEN 'owner'
       ELSE 'editor'
     END AS access_role
     FROM trips t
     WHERE t.user_id = $1
      OR EXISTS (
        SELECT 1
        FROM trip_collaborators tc
        WHERE tc.trip_id = t.id
         AND tc.user_id = $1
         AND tc.status = 'accepted'
      )
     ORDER BY t.created_at DESC`,
     [user_id]
  );

  return result.rows;
};

const getTripById = async (id, user_id) => {
  const result = await pool.query(
    `SELECT id, 
    title, 
    destination, 
    start_date::text AS start_date, 
    end_date::text AS end_date, 
    total_budget, 
    currency, 
    num_of_people, 
    created_at,
    CASE
      WHEN t.user_id = $2 THEN 'owner'
      ELSE 'editor'
    END AS access_role
    FROM trips t
    WHERE t.id = $1
      AND (
        t.user_id = $2
        OR EXISTS (
          SELECT 1
          FROM trip_collaborators tc
          WHERE tc.trip_id = t.id
           AND tc.user_id = $2
           AND tc.status = 'accepted'
        )
      )`
    , [id, user_id]);
  return result.rows[0];
};

const createTrip = async(tripData) => {
  const {
    user_id,
    title,
    destination,
    start_date,
    end_date,
    total_budget,
    currency,
  } = tripData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO trips
        (user_id, title, destination, start_date, end_date, total_budget, currency, num_of_people)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, 1)
       RETURNING *`,
      [user_id, title, destination, start_date, end_date, total_budget, currency]
    );
    const newTrip = result.rows[0];
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, name)
       SELECT $1, u.id, u.name
       FROM users u
       WHERE u.id = $2
       ON CONFLICT (trip_id, user_id) WHERE user_id IS NOT NULL
       DO UPDATE SET name = EXCLUDED.name`,
      [newTrip.id, user_id]
    );
    await client.query("COMMIT");
    return newTrip;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateTrip = async(id, user_id, tripData) => {
  const {
    title, destination, start_date, end_date, total_budget, currency,
  } = tripData;

  const result = await pool.query(
    `UPDATE trips t
     SET title = $1, 
      destination = $2, 
      start_date = $3, 
      end_date = $4, 
      total_budget = $5, 
      currency = $6
     WHERE t.id = $7
      AND (
        t.user_id = $8
        OR EXISTS (
          SELECT 1
          FROM trip_collaborators tc
          WHERE tc.trip_id = t.id
           AND tc.user_id = $8
           AND tc.status = 'accepted'
        )
      )
     RETURNING t.*`,
    [title, destination, start_date, end_date, total_budget, currency, id, user_id]
  );

  return result.rows[0];
};

const deleteTrip = async (id, user_id) => {
  const result = await pool.query(
    `DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, user_id]
  );

  return result.rows[0];
};

const updateTripPeopleCount = async (tripId, user_id) => {
  const result = await pool.query(
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
     WHERE t.id = $1
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
     RETURNING t.*`,
    [tripId, user_id]
  );
  return result.rows[0];
};


module.exports = {getAllTrips, getTripById, createTrip, updateTrip, deleteTrip, updateTripPeopleCount};

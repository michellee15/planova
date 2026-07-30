const pool = require("../config/db");

const getItineraryByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT i.id,
     i.trip_id,
     i.title,
     i.location,
     i.itinerary_date::text AS itinerary_date,
     i.start_time, 
     i.end_time,
     i.notes, 
     i.created_at,
     i.latitude,
     i.longitude,
     i.formatted_address,
     i.place_id
     FROM itinerary_items i
     JOIN trips t ON i.trip_id = t.id
     WHERE i.trip_id = $1
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
     ORDER BY itinerary_date ASC, start_time ASC, created_at ASC`, [tripId, user_id]
  );
  return result.rows;
};

const createItinerary = async (itineraryData) => {
  const { user_id, trip_id, title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id } = itineraryData;
  const tripCheck = await pool.query(
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
      )`,
    [trip_id, user_id]
  );
  if (tripCheck.rows.length === 0) return null;

  const result = await pool.query(
    `INSERT INTO itinerary_items
     (trip_id, title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id)
     VALUES 
     ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
     [trip_id, title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id]
  );
  return result.rows[0];
};

const updateItinerary = async (id, user_id, itineraryData) => {
  const {  title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id } = itineraryData;
  const result = await pool.query(
    `UPDATE itinerary_items i
     SET title = $1,
      location = $2,
      itinerary_date = $3,
      start_time = $4,
      end_time = $5,
      notes = $6,
      latitude = $7,
      longitude = $8,
      formatted_address = $9,
      place_id = $10
     FROM trips t
     WHERE i.trip_id = t.id
      AND i.id = $11
      AND (
        t.user_id = $12
        OR EXISTS (
          SELECT 1
          FROM trip_collaborators tc
          WHERE tc.trip_id = t.id
           AND tc.user_id = $12
           AND tc.status = 'accepted'
        )
      )
     RETURNING i.*`,
     [title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id, id, user_id]
  );
  return result.rows[0];
};

const deleteItinerary = async (id, user_id) => {
  const result = await pool.query(
    `DELETE FROM itinerary_items i
     USING trips t
     WHERE i.trip_id = t.id
      AND i.id = $1
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
     RETURNING i.*`, [id, user_id]
  );
  return result.rows[0];
};

const createItineraryBatch = async ({ user_id, trip_id, items }) => {
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

    const createdItems = [];
    for (const item of items) {
      const result = await client.query(
        `INSERT INTO itinerary_items
         (trip_id, title, location, itinerary_date, start_time, end_time, notes, latitude, longitude, formatted_address, place_id)
         VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          trip_id,
          item.title,
          item.location,
          item.itinerary_date,
          item.start_time,
          item.end_time,
          item.notes,
          item.latitude,
          item.longitude,
          item.formatted_address,
          item.place_id,
        ]
      );
      createdItems.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return createdItems;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getItineraryByTripId,
  createItinerary,
  createItineraryBatch,
  updateItinerary,
  deleteItinerary,
};

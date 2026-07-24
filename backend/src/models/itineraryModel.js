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
      AND t.user_id = $2
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
      AND user_id = $2`,
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
      AND t.user_id = $12
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
      AND t.user_id = $2
     RETURNING i.*`, [id, user_id]
  );
  return result.rows[0];
};

module.exports = {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
};
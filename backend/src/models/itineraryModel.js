const pool = require("../config/db");

const getItineraryByTripId = async (tripId) => {
  const result = await pool.query(
    `SELECT id,
     trip_id,
     title,
     location,
     itinerary_date::text AS itinerary_date,
     start_time, 
     end_time,
     notes, 
     created_at
     FROM itinerary_items
     WHERE trip_id = $1
     ORDER BY itinerary_date ASC, start_time ASC, created_at ASC`, [tripId]
  );
  return result.rows;
};

const createItinerary = async (itineraryData) => {
  const { trip_id, title, location, itinerary_date, start_time, end_time, notes } = itineraryData;
  const result = await pool.query(
    `INSERT INTO itinerary_items
     (trip_id, title, location, itinerary_date, start_time, end_time, notes)
     VALUES 
     ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
     [trip_id, title, location, itinerary_date, start_time, end_time, notes]
  );
  return result.rows[0];
};

const updateItinerary = async (id, itineraryData) => {
  const {  title, location, itinerary_date, start_time, end_time, notes } = itineraryData;
  const result = await pool.query(
    `UPDATE itinerary_items
     SET title = $1,
      location = $2,
      itinerary_date = $3,
      start_time = $4,
      end_time = $5,
      notes = $6
     WHERE id = $7
     RETURNING *`,
     [title, location, itinerary_date, start_time, end_time, notes, id]
  );
  return result.rows[0];
};

const deleteItinerary = async (id) => {
  const result = await pool.query(
    `DELETE FROM itinerary_items
     WHERE id = $1
     RETURNING *`, [id]
  );
  return result.rows[0];
};

module.exports = {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
};
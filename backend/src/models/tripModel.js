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
     created_at
     FROM trips 
     WHERE user_id = $1
     ORDER BY created_at DESC`,
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
    created_at 
    FROM trips 
    WHERE id = $1
      AND user_id = $2`
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
    num_of_people,
  } = tripData;

  const result = await pool.query(
    `INSERT INTO trips
      (user_id, title, destination, start_date, end_date, total_budget, currency, num_of_people)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      user_id, title, destination, start_date, end_date, total_budget, currency, num_of_people
    ]
  );

  return result.rows[0];
};

const updateTrip = async(id, user_id, tripData) => {
  const {
    title, destination, start_date, end_date, total_budget, currency, num_of_people,
  } = tripData;

  const result = await pool.query(
    `UPDATE trips 
     SET title = $1, 
      destination = $2, 
      start_date = $3, 
      end_date = $4, 
      total_budget = $5, 
      currency = $6,
      num_of_people = $7
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [ title, destination, start_date, end_date, total_budget, currency, num_of_people, id, user_id,]
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
    `UPDATE trips
     SET num_of_people = (
      SELECT COUNT(*)
      FROM trip_members
      WHERE trip_id = $1
     )
     WHERE id = $1
      AND user_id = $2
     RETURNING *`,
    [tripId, user_id]
  );
  return result.rows[0];
};


module.exports = {getAllTrips, getTripById, createTrip, updateTrip, deleteTrip, updateTripPeopleCount};
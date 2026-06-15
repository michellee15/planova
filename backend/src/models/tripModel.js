const pool = require("../config/db");

const getAllTrips = async () => {
  const result = await pool.query(
    "SELECT * FROM trips ORDER BY created_at DESC"
  );

  return result.rows;
};

const getTripById = async (id) => {
  const result = await pool.query("SEELCT * FROM trips WHERE is = $1", [id]);
  return result.rows[0];
};

const createTrip = async(tripData) => {
  const {
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
      (title, destination, start_date, end_date, total_budget, currency, num_of_people)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      title, destination, start_date, end_date, total_budget, currency, num_of_people
    ]
  );

  return result.rows[0];
};

const updateTrip = async(id, tripData) => {
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
     WHERE id = $8
     RETURNING 8`,
    [ title, destination, start_date, end_date, total_budget, currency, num_of_people, id,]
  );

  return result.rows[0];
};

const deleteTrip = async (id) => {
  const result = await pool.query(
    "DELETE FROM trips WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

module.exports = {getAllTrips, getTripById, createTrip, updateTrip, deleteTrip,};
const pool = require("../config/db");

const getExpensesByTripId = async (tripId) => {
  const result = await pool.query(
    `SELECT id, trip_id, title, amount, category, paid_by, expense_date::text AS expense_date, created_at
     FROM expenses
     WHERE trip_id = $1
     ORDER BY created_at DESC`,
    [tripId]
  );

  return result.rows;
};

const createExpense = async (expenseData) => {
  const { trip_id, title, amount, category, paid_by, expense_date } =
    expenseData;
  const result = await pool.query(
    `INSERT INTO expenses 
      (trip_id, title, amount, category, paid_by, expense_date)
     VALUES 
      ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [trip_id, title, amount, category, paid_by, expense_date]
  );
  return result.rows[0];
};

const updateExpense = async (id, expenseData) => {
  const { title, amount, category, paid_by, expense_date } = expenseData;
  const result = await pool.query(
    `UPDATE expenses
     SET title = $1,
         amount = $2,
         category = $3,
         paid_by = $4,
         expense_date = $5
     WHERE id = $6
     RETURNING *`,
    [title, amount, category, paid_by, expense_date, id]
  );
  return result.rows[0];
};

const deleteExpense = async (id) => {
  const result = await pool.query(
    `DELETE FROM expenses
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
};
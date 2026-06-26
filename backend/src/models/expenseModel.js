const pool = require("../config/db");

const getExpensesByTripId = async (tripId) => {
  const result = await pool.query(
    `SELECT e.id, 
      e.trip_id, 
      e.title,
      e.amount,
      e.category,
      e.paid_by_member_id,
      e.expense_date::text AS expense_date,
      e.created_at,
      tm.name AS payer_name 
     FROM expenses e
     LEFT JOIN trip_members tm
     ON e.paid_by_member_id = tm.id
     WHERE e.trip_id = $1
     ORDER BY e.created_at DESC`,
    [tripId]
  );

  return result.rows;
};

const createExpense = async (expenseData) => {
  const { trip_id, title, amount, category, paid_by_member_id, expense_date } =
    expenseData;
  const result = await pool.query(
    `INSERT INTO expenses 
      (trip_id, title, amount, category, paid_by_member_id, expense_date)
     VALUES 
      ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [trip_id, title, amount, category, paid_by_member_id, expense_date]
  );
  return result.rows[0];
};

const updateExpense = async (id, expenseData) => {
  const { title, amount, category, paid_by_member_id, expense_date } = expenseData;
  const result = await pool.query(
    `UPDATE expenses
     SET title = $1,
         amount = $2,
         category = $3,
         paid_by_member_id = $4,
         expense_date = $5
     WHERE id = $6
     RETURNING *`,
    [title, amount, category, paid_by_member_id, expense_date, id]
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
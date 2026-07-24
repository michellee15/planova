const pool = require("../config/db");

const getExpensesByTripId = async (tripId, user_id) => {
  const result = await pool.query(
    `SELECT e.id, 
      e.trip_id, 
      e.title,
      e.amount,
      e.category,
      e.paid_by_member_id,
      e.expense_date::text AS expense_date,
      e.created_at,
      payer.name AS payer_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', sm.id,
            'name', sm.name
          )
        ) FILTER (WHERE sm.id IS NOT NULL),
        '[]'::json
      ) AS split_members
     FROM expenses e
     LEFT JOIN trip_members payer ON e.paid_by_member_id = payer.id
     LEFT JOIN expense_splits es ON e.id = es.expense_id
     LEFT JOIN trip_members sm ON es.member_id = sm.id
     JOIN trips t ON e.trip_id = t.id
     WHERE e.trip_id = $1
      AND t.user_id = $2
     GROUP BY e.id, payer.name
     ORDER BY e.created_at DESC`,
    [tripId, user_id]
  );
  return result.rows;
};

const createExpense = async (expenseData) => {
  const {user_id, trip_id, title, amount, category, paid_by_member_id, split_member_ids, expense_date } =
    expenseData;
  const tripCheck = await pool.query(
    `SELECT id 
     FROM trips 
     WHERE id = $1 
      AND user_id = $2`,
    [trip_id, user_id]
  );
  if (tripCheck.rows.length === 0) return null;
  const result = await pool.query(
    `INSERT INTO expenses 
      (trip_id, title, amount, category, paid_by_member_id, expense_date)
     VALUES 
      ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [trip_id, title, amount, category, paid_by_member_id, expense_date]
  );
  const newExpense = result.rows[0];
  const splitMembers = Array.isArray(split_member_ids) ? split_member_ids : [];
  for (const memberId of splitMembers) {
    await pool.query(
      `INSERT INTO expense_splits (expense_id, member_id)
       VALUES ($1, $2)`,
       [newExpense.id, memberId]
    );
  }
  return newExpense;
};

const updateExpense = async (id, user_id, expenseData) => {
  const { title, amount, category, paid_by_member_id, split_member_ids, expense_date } = expenseData;
  const result = await pool.query(
    `UPDATE expenses e
     SET title = $1,
         amount = $2,
         category = $3,
         paid_by_member_id = $4,
         expense_date = $5
     FROM trips t
     WHERE e.trip_id = t.id
       AND e.id = $6
       AND t.user_id = $7
     RETURNING e.*`,
    [title, amount, category, paid_by_member_id, expense_date, id, user_id]
  );
  const updatedExpense = result.rows[0];
  if (!updatedExpense) return null;
  await pool.query(`DELETE FROM expense_splits WHERE expense_id = $1`, [id]);

  const splitMembers = Array.isArray(split_member_ids) ? split_member_ids : [];
  for (const memberId of splitMembers) {
    await pool.query(
      `INSERT INTO expense_splits (expense_id, member_id) VALUES ($1, $2)`, [id, memberId]
    );
  }
  return updatedExpense;
};

const deleteExpense = async (id,  user_id) => {
  const result = await pool.query(
    `DELETE FROM expenses e
     USING trips t
     WHERE e.trip_id = t.id
      AND e.id = $1
      AND t.user_id = $2
     RETURNING e.*`,
    [id, user_id]
  );
  return result.rows[0];
};

module.exports = {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
};
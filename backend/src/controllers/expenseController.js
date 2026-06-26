const expenseModel = require("../models/expenseModel");

const getExpensesByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;
    const expenses = await expenseModel.getExpensesByTripId(tripId);
    res.json(expenses);
  } catch (error) {
    console.error("Error getting expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title, amount, category, paid_by_member_id, split_member_ids, expense_date } = req.body;
    if (!title || amount === undefined || amount === null) return res.status(400).json({message: "Title and amount are required",});

    const newExpense = await expenseModel.createExpense({
      trip_id: tripId,
      title,
      amount,
      category: category || null,
      paid_by_member_id: paid_by_member_id || null,
      split_member_ids: split_member_ids || [],
      expense_date: expense_date || null,
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, paid_by_member_id, split_member_ids, expense_date } = req.body;

    if (!title || amount === undefined || amount === null) return res.status(400).json({message: "Title and amount are required",});
    const updatedExpense = await expenseModel.updateExpense(id, {
      title,
      amount,
      category: category || null,
      paid_by_member_id: paid_by_member_id || null,
      split_member_ids: split_member_ids || [],
      expense_date: expense_date || null,
    });

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found" });
    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await expenseModel.deleteExpense(id);
    if (!deletedExpense) return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
};
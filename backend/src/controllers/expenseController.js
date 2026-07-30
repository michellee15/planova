const expenseModel = require("../models/expenseModel");
const {
  isValidIsoDate,
  getTripDateConstraintMessage,
} = require("../utils/dateValidation");

const getExpensesByTripId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const expenses = await expenseModel.getExpensesByTripId(tripId, userId);
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
    if (expense_date && !isValidIsoDate(expense_date)) {
      return res
        .status(400)
        .json({ message: "Expense date must use YYYY-MM-DD format" });
    }

    const newExpense = await expenseModel.createExpense({
      user_id: req.user.id,
      trip_id: tripId,
      title,
      amount,
      category: category || null,
      paid_by_member_id: paid_by_member_id || null,
      split_member_ids: split_member_ids || [],
      expense_date: expense_date || null,
    });
    if (!newExpense) return res.status(404).json({message: "Trip not found"});
    res.status(201).json(newExpense);
  } catch (error) {
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, amount, category, paid_by_member_id, split_member_ids, expense_date } = req.body;

    if (!title || amount === undefined || amount === null) return res.status(400).json({message: "Title and amount are required",});
    if (expense_date && !isValidIsoDate(expense_date)) {
      return res
        .status(400)
        .json({ message: "Expense date must use YYYY-MM-DD format" });
    }
    
    const updatedExpense = await expenseModel.updateExpense(id, userId, {
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
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deletedExpense = await expenseModel.deleteExpense(id, userId);
    if (!deletedExpense) return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense deleted successfully", deletedExpense });
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

const express = require("express");
const {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/trips/:tripId/expenses", getExpensesByTripId);
router.post("/trips/:tripId/expenses", createExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

module.exports = router;
const express = require("express");
const reqAuth = require("../middleware/requireAuthentication");

const {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/trips/:tripId/expenses", reqAuth, getExpensesByTripId);
router.post("/trips/:tripId/expenses", reqAuth, createExpense);
router.put("/expenses/:id", reqAuth, updateExpense);
router.delete("/expenses/:id", reqAuth, deleteExpense);

module.exports = router;
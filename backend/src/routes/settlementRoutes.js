const express = require("express");
const router = express.Router();
const {getSettlementByTripId, createSettlement, deleteSettlement} = require("../controllers/settlementController");

router.get("/trips/:tripId/settlements", getSettlementByTripId);
router.post("/trips/:tripId/settlements", createSettlement);
router.delete("/settlements/:id", deleteSettlement);

module.exports = router;
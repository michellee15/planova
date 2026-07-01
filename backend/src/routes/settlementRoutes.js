const express = require("express");
const router = express.Router();
const {getSettlementByTripId, createSettlement} = require("../controllers/settlementController");

router.get("/trips/:tripId/settlements", getSettlementByTripId);
router.post("/trips/:tripId/settlements", createSettlement);

module.exports = router;
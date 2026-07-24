const express = require("express");
const reqAuth = require("../middleware/requireAuthentication");

const router = express.Router();
const {getSettlementByTripId, createSettlement, deleteSettlement} = require("../controllers/settlementController");

router.get("/trips/:tripId/settlements", reqAuth, getSettlementByTripId);
router.post("/trips/:tripId/settlements", reqAuth, createSettlement);
router.delete("/settlements/:id", reqAuth, deleteSettlement);

module.exports = router;
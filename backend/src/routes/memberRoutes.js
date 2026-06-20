const express = require("express");
const {
  getMembersByTripId, createMember, deleteMember
} = require("../controllers/memberController");

const router = express.Router();

router.get("/trips/:tripId/members", getMembersByTripId);
router.post("/trips/:tripId/members", createMember);
router.delete("/members/:id", deleteMember);

module.exports = router;

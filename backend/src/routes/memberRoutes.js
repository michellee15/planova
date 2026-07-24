const express = require("express");
const reqAuth = require("../middleware/requireAuthentication");

const {
  getMembersByTripId, createMember, deleteMember
} = require("../controllers/memberController");

const router = express.Router();

router.get("/trips/:tripId/members", reqAuth, getMembersByTripId);
router.post("/trips/:tripId/members", reqAuth, createMember);
router.delete("/members/:id", reqAuth, deleteMember);

module.exports = router;

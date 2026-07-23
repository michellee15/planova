const express = require("express");
const requireAuth = require("../middleware/requireAuthentication");

const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");

const router = express.Router();

router.get("/", requireAuth, getTrips);
router.get("/:id", requireAuth, getTrip);
router.post("/", requireAuth, createTrip);
router.put("/:id", requireAuth, updateTrip);
router.delete("/:id", requireAuth, deleteTrip);

module.exports = router;
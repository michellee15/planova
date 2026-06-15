const express = require("express");

const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");

const router = express.Router();

router.get("/", getTrips);
router.get("/:id", getTrip);
router.post("/", createTrip);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
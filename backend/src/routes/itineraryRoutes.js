const express = require("express");
const {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} = require("../controllers/itineraryController");

const router = express.Router();

router.get("/trips/:tripId/itinerary", getItineraryByTripId);
router.post("/trips/:tripId/itinerary", createItinerary);
router.put("/itinerary/:id", updateItinerary);
router.delete("/itinerary/:id", deleteItinerary);

module.exports = router;
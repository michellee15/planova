const express = require("express");
const reqAuth = require("../middleware/requireAuthentication");

const {
  getItineraryByTripId,
  createItinerary,
  createItineraryBatch,
  updateItinerary,
  deleteItinerary,
} = require("../controllers/itineraryController");

const router = express.Router();

router.get("/trips/:tripId/itinerary", reqAuth, getItineraryByTripId);
router.post("/trips/:tripId/itinerary", reqAuth, createItinerary);
router.post("/trips/:tripId/itinerary/batch", reqAuth, createItineraryBatch);
router.put("/itinerary/:id", reqAuth, updateItinerary);
router.delete("/itinerary/:id", reqAuth, deleteItinerary);

module.exports = router;

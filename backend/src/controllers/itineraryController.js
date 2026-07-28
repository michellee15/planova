const itineraryModel = require("../models/itineraryModel");
const { geocodeLocation } = require("../services/geocodeService");

const getItineraryByTripId = async (req, res) => {
  try {
    const userId = req.user.id;
    const {tripId} = req.params;
    const itineraries = await itineraryModel.getItineraryByTripId(tripId, userId);
    res.json(itineraries);
  } catch (error) {
    console.error("Error getting itinerary: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createItinerary = async(req, res) => {
  try {
    let geocodedLoc = null;
    const {tripId} = req.params;
    const {title, location, itinerary_date, start_time, end_time, notes} = req.body;
    if (!title || !itinerary_date) return res.status(400).json({message: "Title and itinerary date are required"});
    if (location) {
      try {
        geocodedLoc = await geocodeLocation(location);
      } catch (error) {
        console.error("Geocoding failed: ", error);
      }
    }
    const newItinerary = await itineraryModel.createItinerary({
      user_id: req.user.id,
      trip_id: tripId,
      title,
      location: location || null,
      itinerary_date: itinerary_date || null,
      start_time: start_time || null,
      end_time: end_time || null,
      notes: notes || null,
      latitude: geocodedLoc?.latitude || null,
      longitude: geocodedLoc?.longitude || null,
      formatted_address: geocodedLoc?.formatted_address || null,
      place_id: geocodedLoc?.place_id || null,
    });
    console.log("Location received:", location);
    console.log("Geocoded location:", geocodedLoc);
    if (!newItinerary) return res.status(404).json({message: "Trip not found"});
    res.status(201).json(newItinerary);
  } catch (error) {
    console.error("Error creating itinerary: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const updateItinerary = async (req, res) => {
  try {
    let geocodedLoc = null;
    const userId = req.user.id;
    const {id} = req.params;
    const {title, location, itinerary_date, start_time, end_time, notes } = req.body;
    if (!title || !itinerary_date) return res.status(400).json({message: "Title and itinerary date are required"});
    if (location) {
      try {
        geocodedLoc = await geocodeLocation(location);
      } catch (error) {
        console.error("Geocoding failed: ", error);
      }
    }
    const updatedItinerary = await itineraryModel.updateItinerary(id, userId, {
      title,
      location,
      itinerary_date: itinerary_date || null,
      start_time: start_time || null,
      end_time: end_time|| null,
      notes: notes || null,
      latitude: geocodedLoc?.latitude || null,
      longitude: geocodedLoc?.longitude || null,
      formatted_address: geocodedLoc?.formatted_address || null,
      place_id: geocodedLoc?.place_id || null
    });
    if (!updatedItinerary) return res.status(404).json({message: "Itinerary not found"});
    res.json(updatedItinerary);
  } catch (error) {
    console.error("Error updating itinerary", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteItinerary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deletedItinerary = await itineraryModel.deleteItinerary(id, userId);
    if (!deletedItinerary) return res.status(404).json({message: "Itinerary not found"});
    res.json({message: "Itinerary deleted successfully"});
  } catch (error) {
    console.error("Error deleting itinerary", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
};
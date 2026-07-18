const itineraryModel = require("../models/itineraryModel");

const getItineraryByTripId = async (req, res) => {
  try {
    const {tripId} = req.params;
    const itineraries = await itineraryModel.getItineraryByTripId(tripId);
    res.json(itineraries);
  } catch (error) {
    console.error("Error getting itinerary: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createItinerary = async(req, res) => {
  try {
    const {tripId} = req.params;
    const {title, location, itinerary_date, start_time, end_time, notes} = req.body;
    if (!title || !itinerary_date) return res.status(400).json({message: "Title and itinerary date are required"});
    const newItinerary = await itineraryModel.createItinerary({
      trip_id: tripId,
      title,
      location,
      itinerary_date: itinerary_date || null,
      start_time: start_time || null,
      end_time: end_time || null,
      notes,
    });
    res.status(201).json(newItinerary);
  } catch (error) {
    console.error("Error creating itinerary: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const updateItinerary = async (req, res) => {
  try {
    const {id} = req.params;
    const {title, location, itinerary_date, start_time, end_time, notes} = req.body;
    if (!title || !itinerary_date) return res.status(400).json({message: "Title and itinerary date are required"});
    const updatedItinerary = await itineraryModel.updateItinerary(id, {
      title,
      location,
      itinerary_date: itinerary_date || null,
      start_time: start_time || null,
      end_time: end_time|| null,
      notes,  
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
    const { id } = req.params;
    const deletedItinerary = await itineraryModel.deleteItinerary(id);
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
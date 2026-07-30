const itineraryModel = require("../models/itineraryModel");
const { geocodeLocation } = require("../services/geocodeService");
const {
  isValidIsoDate,
  getTripDateConstraintMessage,
} = require("../utils/dateValidation");

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
    if (!isValidIsoDate(itinerary_date)) {
      return res
        .status(400)
        .json({ message: "Itinerary date must use YYYY-MM-DD format" });
    }
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
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error creating itinerary: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createItineraryBatch = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return res
        .status(400)
        .json({ message: "Items must contain between 1 and 20 itinerary entries" });
    }

    const normalizedItems = [];
    for (const item of items) {
      if (
        !item ||
        typeof item.title !== "string" ||
        item.title.trim().length === 0 ||
        item.title.length > 200 ||
        typeof item.itinerary_date !== "string" ||
        !isValidIsoDate(item.itinerary_date)
      ) {
        return res.status(400).json({
          message:
            "Every item requires a title of 200 characters or fewer and an itinerary date",
        });
      }
      if (
        (item.start_time &&
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start_time)) ||
        (item.end_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.end_time))
      ) {
        return res
          .status(400)
          .json({ message: "Start and end times must use HH:MM format" });
      }

      const latitude =
        item.latitude === undefined || item.latitude === null
          ? null
          : Number(item.latitude);
      const longitude =
        item.longitude === undefined || item.longitude === null
          ? null
          : Number(item.longitude);
      if (
        (latitude !== null &&
          (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude !== null &&
          (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
      ) {
        return res.status(400).json({ message: "Item coordinates are invalid" });
      }

      normalizedItems.push({
        title: item.title.trim(),
        location:
          typeof item.location === "string" ? item.location.trim() || null : null,
        itinerary_date: item.itinerary_date,
        start_time: item.start_time || null,
        end_time: item.end_time || null,
        notes: typeof item.notes === "string" ? item.notes : null,
        latitude,
        longitude,
        formatted_address:
          typeof item.formatted_address === "string"
            ? item.formatted_address
            : null,
        place_id:
          typeof item.place_id === "string" ? item.place_id.slice(0, 255) : null,
      });
    }

    const createdItems = await itineraryModel.createItineraryBatch({
      user_id: req.user.id,
      trip_id: tripId,
      items: normalizedItems,
    });
    if (!createdItems) return res.status(404).json({ message: "Trip not found" });
    res.status(201).json(createdItems);
  } catch (error) {
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error creating itinerary batch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateItinerary = async (req, res) => {
  try {
    let geocodedLoc = null;
    const userId = req.user.id;
    const {id} = req.params;
    const {title, location, itinerary_date, start_time, end_time, notes } = req.body;
    if (!title || !itinerary_date) return res.status(400).json({message: "Title and itinerary date are required"});
    if (!isValidIsoDate(itinerary_date)) {
      return res
        .status(400)
        .json({ message: "Itinerary date must use YYYY-MM-DD format" });
    }
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
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
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
  createItineraryBatch,
  updateItinerary,
  deleteItinerary,
};

const tripModel = require("../models/tripModel");
const {
  validateTripDatePair,
  getTripDateConstraintMessage,
} = require("../utils/dateValidation");

const getTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await tripModel.getAllTrips(userId);
    res.status(200).json(trips);
  } catch (error) {
    console.error("Error getting trips: ", error);
    res.status(500).json({message: "Internal server error" });
  }
};

const getTrip = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;
    const trip = await tripModel.getTripById(id, userId);
    if (!trip) {
      return res.status(404).json({message: "Trip not found"});
    }
    res.status(200).json(trip);
  } catch (error) {
    console.error("Error getting trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createTrip = async (req, res) => {
  try {
    const { title, destination, start_date, end_date, total_budget, currency, num_of_people,} = req.body;
    if (!title || !destination) {
      return res.status(400).json({message: "Title and destination are required",});
    }
    const dateError = validateTripDatePair(start_date, end_date);
    if (dateError) return res.status(400).json({ message: dateError });

    const newTrip = await tripModel.createTrip({
      user_id: req.user.id,
      title, 
      destination, 
      start_date: start_date || null,
      end_date: end_date || null,
      total_budget, 
      currency: currency || "SGD", 
      num_of_people: num_of_people || 1,
    });
    res.status(201).json(newTrip);
  } catch (error) {
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error creating trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const updateTrip = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;
    const dateError = validateTripDatePair(
      req.body.start_date,
      req.body.end_date
    );
    if (dateError) return res.status(400).json({ message: dateError });

    const updatedTrip = await tripModel.updateTrip(id, userId, {
      ...req.body,
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
    });
    if (!updatedTrip) {
      return res.status(404).json({message: "Trip not found"});
    }
    res.status(200).json(updatedTrip);
  } catch (error) {
    const dateConstraintMessage = getTripDateConstraintMessage(error);
    if (dateConstraintMessage) {
      return res.status(400).json({ message: dateConstraintMessage });
    }
    console.error("Error updating trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteTrip = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;
    const deletedTrip = await tripModel.deleteTrip(id, userId);
    if (!deletedTrip) {
      return res.status(404).json({message: "Trip not found"});
    }
    res.status(200).json({
      message: "Trip deleted successfully", deletedTrip,
    });
  } catch (error) {
    console.error("Error deleting trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  getTrips, getTrip, createTrip, updateTrip, deleteTrip,
};

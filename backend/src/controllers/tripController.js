const tripModel = require("../models/tripModel");

const getTrips = async (req, res) => {
  try {
    const trips = await tripModel.getAllTrips();
    res.status(200).json(trips);
  } catch (error) {
    console.error("Error getting trips: ", error);
    res.status(500).json({message: "Internal server error" });
  }
};

const getTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await tripModel.getTripById(id);
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

    const newTrip = await tripModel.createTrip({
      title, 
      destination, 
      start_date, 
      end_date, 
      total_budget, 
      currency: currency || "SGD", 
      num_of_people: num_of_people || 1,
    });
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("Error creating trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const updateTrip = async (req, res) => {
  try {
    const {id} = req.params;
    const updatedTrip = await tripModel.updateTrip(id, req.body);
    if (!updatedTrip) {
      return res.status(404).json({message: "Trip not found"});
    }
    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteTrip = async (req, res) => {
  try {
    const {id} = req.params;
    const deletedTrip = await tripModel.deleteTrip(id);
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
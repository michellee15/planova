const memberModel = require("../models/memberModel");
const tripModel = require("../models/tripModel");

const getMembersByTripId = async (req, res) => {
  try {
    const {tripId} = req.params;
    const members = await memberModel.getMembersByTripId(tripId);
    res.json(members);
  } catch (error) {
    console.error("Error getting members: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createMember = async (req, res) => {
  try {
    const {tripId} = req.params;
    const {name} = req.body;
    if (!name) return res.status(400).json({message: "Member name is required."});
    const newMember = await memberModel.createMember({trip_id: tripId, name,});
    await tripModel.updateTripPeopleCount(tripId);
    res.status(201).json(newMember);
  } catch (error) {
    console.error("Error creating member: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteMember = async (req, res) => {
  try {
    const {id} = req.params;
    const deletedMember = await memberModel.deleteMember(id);
    if (!deletedMember) return res.status(400).json({message: "Member not found."});
    await tripModel.updateTripPeopleCount(deletedMember.trip_id);
    res.json({message: "Member deleted successfully."});
  } catch (error) {
    console.error("Error deleting member: ", error);
    res.status(500).json({message: "Internal server error"});
  }
}

module.exports = {
  getMembersByTripId,
  createMember,
  deleteMember,
};

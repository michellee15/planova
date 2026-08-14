const memberModel = require("../models/memberModel");

const getMembersByTripId = async (req, res) => {
  try {
    const userId = req.user.id
    const {tripId} = req.params;
    const members = await memberModel.getMembersByTripId(tripId, userId);
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
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (!normalizedName) {
      return res.status(400).json({message: "Member name is required."});
    }
    const newMember = await memberModel.createMember({
      user_id: req.user.id,
      trip_id: tripId,
      name: normalizedName,
    });
    if (!newMember) return res.status(404).json({message: "Trip not found"});
    res.status(201).json(newMember);
  } catch (error) {
    console.error("Error creating member: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const {id} = req.params;
    const deletion = await memberModel.deleteMember(id, userId);
    if (!deletion) return res.status(404).json({message: "Member not found."});
    if (deletion.protected) {
      return res.status(409).json({
        message: "Registered members must be managed through trip collaboration settings.",
      });
    }
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

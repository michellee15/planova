const settlementModel = require("../models/settlementModel");
const getSettlementByTripId = async (req, res) => {
  try {
    const userId = req.user.id;
    const {tripId} = req.params;
    const settlements = await settlementModel.getSettlementByTripId(tripId, userId);
    res.json(settlements);
  } catch (error) {
    console.error("Error getting settlements: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const createSettlement = async (req, res) => {
  try {
    const {tripId} = req.params;
    const {from_member_id, to_member_id, amount} = req.body;
    if (!from_member_id || !to_member_id || !amount || amount <= 0) return res.status(400).json({message: "from_member_id, to_member_id and amount are required"});
    const newSettlement = await settlementModel.createSettlement({
      user_id: req.user.id,
      trip_id: tripId, 
      from_member_id, 
      to_member_id, 
      amount,
    });
    if (!newSettlement) return res.status(404).json({message: "Trip not found"});
    res.status(201).json(newSettlement);
  } catch (error) {
    console.error("Error creating settlement: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

const deleteSettlement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deletedSettlement = await settlementModel.deleteSettlement(id, userId);
    if (!deletedSettlement) return res.status(404).json({ message: "Settlement not found" });
    res.json({ message: "Settlement deleted successfully" });
  } catch (error) {
    console.error("Error deleting settlement: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  getSettlementByTripId,
  createSettlement,
  deleteSettlement,
};
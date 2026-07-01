const settlementModel = require("../models/settlementModel");
const getSettlementByTripId = async (req, res) => {
  try {
    const {tripId} = req.params;
    const settlements = await settlementModel.getSettlementByTripId(tripId);
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
    if (!from_member_id || !to_member_id || !amount) return res.status(400),json({message: "from_member_id, to_member_id and amount are required"});
    const newSettlement = await settlementModel.createSettlement({
      trip_id: tripId, 
      from_member_id, 
      to_member_id, 
      amount,
    });
    res.status(200).json(newSettlement);
  } catch (error) {
    console.error("Error creating settlement: ", error);
    res.status(500).json({message: "Internal server error"});
  }
};

module.exports = {
  getSettlementByTripId,
  createSettlement,
};
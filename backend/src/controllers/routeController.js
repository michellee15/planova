const routeService = require("../services/routeService");

const getTravelTimes = async (req, res) => {
  try {
    const {origin, destination} = req.body;
    if (!origin || !destination || origin.latitude == null || origin.longitude == null || destination.latitude == null || destination.longitude == null) {
      return res.status(400).json({message: "Origin and destination coordinates are required"});
    };
    const travelTimes = await routeService.getTravelTimes({origin, destination,});
    res.json(travelTimes);
  } catch (error) {
    console.error("Error getting travel times: ", error);
    res.status(500).json({message: "Failed to get travel times"});
  }
};

module.exports = {getTravelTimes};
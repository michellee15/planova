const express = require("express");
const requireAuth = require("../middleware/requireAuthentication");
const {getTravelTimes} = require("../controllers/routeController");

const router = express.Router();

router.post("/routes/travel-times", requireAuth, getTravelTimes);

module.exports = router;
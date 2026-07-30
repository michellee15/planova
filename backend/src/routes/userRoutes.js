const express = require("express");
const requireAuth = require("../middleware/requireAuthentication");
const {
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);

module.exports = router;

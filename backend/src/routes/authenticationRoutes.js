const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
} = require("../controllers/authenticationController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

module.exports = router;

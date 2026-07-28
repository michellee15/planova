const express = require("express");
const requireAuth = require("../middleware/requireAuthentication");
const chatRateLimit = require("../middleware/chatRateLimit");
const {
  createSession,
  getSessions,
  getMessages,
  sendMessage,
  deleteSession,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/chat/sessions", requireAuth, getSessions);
router.post("/chat/sessions", requireAuth, createSession);
router.get("/chat/sessions/:sessionId/messages", requireAuth, getMessages);
router.post(
  "/chat/sessions/:sessionId/messages",
  requireAuth,
  chatRateLimit,
  sendMessage
);
router.delete("/chat/sessions/:sessionId", requireAuth, deleteSession);

module.exports = router;

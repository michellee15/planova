const chatModel = require("../models/chatModel");
const chatService = require("../services/chatService");

const sendError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode < 500 ? error.message : fallbackMessage;
  return res.status(statusCode).json({ message });
};

const createSession = async (req, res) => {
  try {
    const { trip_id, title } = req.body;
    if (title !== undefined && (typeof title !== "string" || title.length > 120)) {
      return res.status(400).json({ message: "Title must be 120 characters or fewer" });
    }

    const session = await chatModel.createSession({
      userId: req.user.id,
      tripId: trip_id ?? null,
      title: title?.trim() || null,
    });
    if (!session) return res.status(404).json({ message: "Trip not found" });
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating chat session:", error);
    sendError(res, error, "Failed to create chat session");
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await chatModel.getSessionsByUserId(req.user.id);
    res.json(sessions);
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    sendError(res, error, "Failed to get chat sessions");
  }
};

const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await chatModel.getSessionById(sessionId, req.user.id);
    if (!session) return res.status(404).json({ message: "Chat session not found" });

    const messages = await chatModel.getMessagesBySessionId(
      sessionId,
      req.user.id
    );
    const enrichedMessages = messages.map((message) => ({
      ...message,
      response_data: chatService.enrichResponseDataWithGoogleMapsUrls(
        message.response_data
      ),
    }));
    res.json({ session, messages: enrichedMessages });
  } catch (error) {
    console.error("Error getting chat messages:", error);
    sendError(res, error, "Failed to get chat messages");
  }
};

const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      message,
      mode,
      location,
      manual_location,
      timezone,
      radius_km,
    } = req.body;

    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.trim().length > 1000
    ) {
      return res
        .status(400)
        .json({ message: "Message must be between 1 and 1000 characters" });
    }
    if (mode !== undefined && !["auto", "discover", "plan"].includes(mode)) {
      return res
        .status(400)
        .json({ message: "Mode must be auto, discover, or plan" });
    }
    const radiusKm = radius_km === undefined ? 5 : Number(radius_km);
    if (!Number.isFinite(radiusKm) || radiusKm < 0.5 || radiusKm > 25) {
      return res
        .status(400)
        .json({ message: "Radius must be between 0.5 and 25 kilometres" });
    }
    if (
      manual_location !== undefined &&
      (typeof manual_location !== "string" || manual_location.length > 250)
    ) {
      return res
        .status(400)
        .json({ message: "Manual location must be 250 characters or fewer" });
    }
    if (
      timezone !== undefined &&
      (typeof timezone !== "string" || timezone.length > 64)
    ) {
      return res.status(400).json({ message: "Timezone is invalid" });
    }

    const session = await chatModel.getSessionById(sessionId, req.user.id);
    if (!session) return res.status(404).json({ message: "Chat session not found" });
    const history = await chatModel.getMessagesBySessionId(
      sessionId,
      req.user.id,
      20
    );
    const responseData = await chatService.generateChatResponse({
      message: message.trim(),
      mode,
      location,
      manualLocation: manual_location,
      timezone,
      radiusKm,
      session,
      history,
    });
    const savedMessage = await chatModel.saveExchange({
      sessionId,
      userId: req.user.id,
      userMessage: message.trim(),
      assistantMessage: responseData.message,
      responseData,
    });
    if (!savedMessage) {
      return res.status(404).json({ message: "Chat session not found" });
    }
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending chat message:", error);
    if (!error.statusCode && /place service|routing service/i.test(error.message)) {
      error.statusCode = 502;
    }
    sendError(res, error, "Failed to generate recommendations");
  }
};

const deleteSession = async (req, res) => {
  try {
    const deleted = await chatModel.deleteSession(
      req.params.sessionId,
      req.user.id
    );
    if (!deleted) return res.status(404).json({ message: "Chat session not found" });
    res.json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    sendError(res, error, "Failed to delete chat session");
  }
};

module.exports = {
  createSession,
  getSessions,
  getMessages,
  sendMessage,
  deleteSession,
};

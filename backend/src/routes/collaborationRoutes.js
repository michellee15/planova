const express = require("express");
const requireAuth = require("../middleware/requireAuthentication");
const {
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getCollaborators,
  cancelInvitation,
  removeCollaborator,
  leaveTrip,
} = require("../controllers/collaborationController");

const router = express.Router();

router.get("/invitations", requireAuth, getPendingInvitations);
router.post("/invitations/:id/accept", requireAuth, acceptInvitation);
router.post("/invitations/:id/decline", requireAuth, declineInvitation);
router.post("/trips/:tripId/invitations", requireAuth, createInvitation);
router.delete(
  "/trips/:tripId/invitations/:invitationId",
  requireAuth,
  cancelInvitation
);
router.get("/trips/:tripId/collaborators", requireAuth, getCollaborators);
router.delete("/trips/:tripId/collaborators/me", requireAuth, leaveTrip);
router.delete(
  "/trips/:tripId/collaborators/:userId",
  requireAuth,
  removeCollaborator
);

module.exports = router;

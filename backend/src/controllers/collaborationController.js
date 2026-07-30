const collaborationModel = require("../models/collaborationModel");
const userModel = require("../models/userModel");

const requireOwnerAccess = async (tripId, userId, res) => {
  const accessRole = await collaborationModel.getTripAccess(tripId, userId);
  if (!accessRole) {
    res.status(404).json({ message: "Trip not found" });
    return false;
  }
  if (accessRole !== "owner") {
    res.status(403).json({ message: "Only the trip owner can manage collaborators" });
    return false;
  }
  return true;
};

const createInvitation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { email } = req.body;
    if (
      typeof email !== "string" ||
      email.trim().length === 0 ||
      email.trim().length > 320
    ) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!(await requireOwnerAccess(tripId, req.user.id, res))) return;

    const invitedUser = await userModel.findUserByEmail(email.trim());
    if (!invitedUser) {
      return res.status(404).json({ message: "Registered user not found" });
    }
    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    const invitation = await collaborationModel.createInvitation({
      tripId,
      ownerUserId: req.user.id,
      invitedUserId: invitedUser.id,
    });
    if (!invitation) return res.status(404).json({ message: "Trip not found" });
    res.status(201).json({
      ...invitation,
      invited_user: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "This user is already invited or collaborating" });
    }
    console.error("Error creating trip invitation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await collaborationModel.getPendingInvitations(req.user.id);
    res.json(invitations);
  } catch (error) {
    console.error("Error getting trip invitations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const invitation = await collaborationModel.acceptInvitation(
      req.params.id,
      req.user.id
    );
    if (!invitation) {
      return res.status(404).json({ message: "Pending invitation not found" });
    }
    res.json(invitation);
  } catch (error) {
    console.error("Error accepting trip invitation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const declineInvitation = async (req, res) => {
  try {
    const invitation = await collaborationModel.declineInvitation(
      req.params.id,
      req.user.id
    );
    if (!invitation) {
      return res.status(404).json({ message: "Pending invitation not found" });
    }
    res.json({ message: "Invitation declined" });
  } catch (error) {
    console.error("Error declining trip invitation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCollaborators = async (req, res) => {
  try {
    const { tripId } = req.params;
    const accessRole = await collaborationModel.getTripAccess(
      tripId,
      req.user.id
    );
    if (!accessRole) return res.status(404).json({ message: "Trip not found" });
    const collaborators = await collaborationModel.getCollaborators(
      tripId,
      accessRole === "owner"
    );
    res.json({ access_role: accessRole, collaborators });
  } catch (error) {
    console.error("Error getting trip collaborators:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    const { tripId, invitationId } = req.params;
    if (!(await requireOwnerAccess(tripId, req.user.id, res))) return;
    const invitation = await collaborationModel.cancelInvitation(
      tripId,
      invitationId,
      req.user.id
    );
    if (!invitation) {
      return res.status(404).json({ message: "Pending invitation not found" });
    }
    res.json({ message: "Invitation cancelled" });
  } catch (error) {
    console.error("Error cancelling trip invitation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const { tripId, userId } = req.params;
    if (!(await requireOwnerAccess(tripId, req.user.id, res))) return;
    const collaborator = await collaborationModel.removeCollaborator(
      tripId,
      userId,
      req.user.id
    );
    if (!collaborator) {
      return res.status(404).json({ message: "Collaborator not found" });
    }
    res.json({ message: "Collaborator removed" });
  } catch (error) {
    console.error("Error removing trip collaborator:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const leaveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const accessRole = await collaborationModel.getTripAccess(
      tripId,
      req.user.id
    );
    if (!accessRole) return res.status(404).json({ message: "Trip not found" });
    if (accessRole === "owner") {
      return res.status(400).json({ message: "The trip owner cannot leave the trip" });
    }
    const collaboration = await collaborationModel.leaveTrip(
      tripId,
      req.user.id
    );
    if (!collaboration) {
      return res.status(404).json({ message: "Collaboration not found" });
    }
    res.json({ message: "You left the trip" });
  } catch (error) {
    console.error("Error leaving shared trip:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createInvitation,
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getCollaborators,
  cancelInvitation,
  removeCollaborator,
  leaveTrip,
};

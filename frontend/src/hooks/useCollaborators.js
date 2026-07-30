import { useEffect, useMemo, useState } from "react";
import {
  cancelTripInvitation,
  getTripCollaborators,
  inviteTripCollaborator,
  removeTripCollaborator,
} from "../api/collaborationApi";

function useCollaborators(tripId) {
  const [accessRole, setAccessRole] = useState(null);
  const [owner, setOwner] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadInitialCollaborators = async () => {
      try {
        const data = await getTripCollaborators(tripId);
        if (ignore) return;
        setAccessRole(data?.access_role || null);
        setOwner(data?.owner || null);
        setCollaborators(
          Array.isArray(data?.collaborators) ? data.collaborators : [],
        );
      } catch (loadError) {
        if (!ignore) {
          console.error("Error loading collaborators:", loadError);
          setError(loadError.message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInitialCollaborators();
    return () => {
      ignore = true;
    };
  }, [tripId]);

  const inviteCollaborator = async (email) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const invitation = await inviteTripCollaborator(tripId, email);
      const invitedUser = invitation.invited_user || {};
      setCollaborators((current) => [
        ...current,
        {
          id: invitation.id,
          user_id: invitation.user_id,
          name: invitedUser.name,
          email: invitedUser.email,
          status: invitation.status,
          invited_at: invitation.created_at,
        },
      ]);
      setSuccess(`Invitation sent to ${invitedUser.name || email}.`);
      return invitation;
    } catch (inviteError) {
      console.error("Error inviting collaborator:", inviteError);
      setError(inviteError.message);
      throw inviteError;
    } finally {
      setSaving(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await cancelTripInvitation(tripId, invitationId);
      setCollaborators((current) =>
        current.filter(
          (collaborator) => String(collaborator.id) !== String(invitationId),
        ),
      );
    } catch (cancelError) {
      console.error("Error cancelling invitation:", cancelError);
      setError(cancelError.message);
      throw cancelError;
    } finally {
      setSaving(false);
    }
  };

  const removeCollaborator = async (userId) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await removeTripCollaborator(tripId, userId);
      setCollaborators((current) =>
        current.filter(
          (collaborator) =>
            String(collaborator.user_id) !== String(userId),
        ),
      );
    } catch (removeError) {
      console.error("Error removing collaborator:", removeError);
      setError(removeError.message);
      throw removeError;
    } finally {
      setSaving(false);
    }
  };

  const acceptedCount = useMemo(
    () =>
      collaborators.filter((collaborator) => collaborator.status === "accepted")
        .length,
    [collaborators],
  );

  return {
    accessRole,
    owner,
    collaborators,
    acceptedCount,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    inviteCollaborator,
    cancelInvitation,
    removeCollaborator,
  };
}

export default useCollaborators;

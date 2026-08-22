import {useCallback, useEffect, useState} from "react";
import {
  createMember,
  deleteMember,
  getMembersByTripId,
} from "../api/memberApi";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";

function useMembers(tripId) {
  const confirm = useConfirmDialog();
  const [members, setMembers] = useState([]);
  const [memberFormData, setMemberFormData] = useState({name: ""});
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState("");

  const loadMembers = useCallback(async () => {
    if (!tripId) {
      setMembers([]);
      setMembersLoading(false);
      return [];
    }
    setMembersLoading(true);
    setMemberError("");
    try {
      const memberData = await getMembersByTripId(tripId);
      if (Array.isArray(memberData)) {
        setMembers(memberData);
        return memberData;
      } else {
        console.error("Members data is not an array:  ", memberData);
        setMembers([]);
        return [];
      }
    } catch (error) {
      console.error("Error loading members: ", error);
      setMembers([]);
      setMemberError(error.message);
      return [];
    } finally {
      setMembersLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return undefined;
    let active = true;
    getMembersByTripId(tripId)
      .then((memberData) => {
        if (!active) return;
        setMembers(Array.isArray(memberData) ? memberData : []);
      })
      .catch((error) => {
        console.error("Error loading members: ", error);
        if (!active) return;
        setMembers([]);
        setMemberError(error.message);
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tripId]);

  const handleMemberChange = (event) => {
    const {name, value} = event.target;
    setMemberError("");
    setMemberFormData((prevData) => ({
      ...prevData,
      [name] : value,
    }));
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();
    const name = memberFormData.name.trim();
    if (!tripId || !name) return;
    try {
      setMemberSaving(true);
      setMemberError("");
      await createMember(tripId, {name});
      await loadMembers();
      setMemberFormData({name: ""});
    } catch (error) {
      console.error("Error creating member: ", error);
      setMemberError(error.message);
    } finally {
      setMemberSaving(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!tripId) return;
    const member = members.find(
      (item) => String(item.id) === String(memberId),
    );
    const isRegistered =
      member?.member_type === "registered" || member?.user_id != null;
    if (isRegistered) {
      setMemberError(
        "Registered members are managed through trip collaboration settings.",
      );
      return;
    }
    const shouldDelete = await confirm({
      title: `Remove ${member?.name || "this member"}?`,
      description:
        "This may affect expenses and balances linked to this travel companion.",
      confirmLabel: "Remove member",
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      setMemberSaving(true);
      setMemberError("");
      await deleteMember(memberId);
      await loadMembers();
    } catch (error) {
      console.error("Error deleting member: ", error);
      setMemberError(error.message);
    } finally {
      setMemberSaving(false);
    }
  };

  return {
    members,
    memberFormData,
    membersLoading,
    memberSaving,
    memberError,
    loadMembers,
    handleMemberChange,
    handleCreateMember,
    handleDeleteMember,
  };
}

export default useMembers;

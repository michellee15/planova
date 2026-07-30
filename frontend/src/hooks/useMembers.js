import {useEffect, useState} from "react";
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

  const loadMembers = async () => {
    if (!tripId) return;
    try {
      const memberData = await getMembersByTripId(tripId);
      if (Array.isArray(memberData)) {
        setMembers(memberData);
      } else {
        console.error("Members data is not an array:  ", memberData);
        setMembers([]);
      }
    } catch (error) {
      console.error("Error loading members: ", error);
      setMembers([]);
    }
  }

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
        if (active) setMembers([]);
      });
    return () => {
      active = false;
    };
  }, [tripId]);

  const handleMemberChange = (event) => {
    const {name, value} = event.target;
    setMemberFormData((prevData) => ({
      ...prevData,
      [name] : value,
    }));
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();
    if (!tripId || !memberFormData.name) return;
    try {
      await createMember(tripId, {name: memberFormData.name});
      await loadMembers();
      setMemberFormData({name: ""});
    } catch (error) {
      console.error("Error creating member: ", error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!tripId) return;
    const member = members.find(
      (item) => String(item.id) === String(memberId),
    );
    const shouldDelete = await confirm({
      title: `Remove ${member?.name || "this member"}?`,
      description:
        "This may affect expenses and balances linked to this travel companion.",
      confirmLabel: "Remove member",
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteMember(memberId);
      await loadMembers();
    } catch (error) {
      console.error("Error deleting member: ", error);
    }
  };

  return {
    members, memberFormData, loadMembers, handleMemberChange, handleCreateMember, handleDeleteMember
  };
}

export default useMembers;

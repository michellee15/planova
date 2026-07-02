import { useEffect, useState } from "react";
import { getSettlementByTripId, createSettlement, deleteSettlement } from "../api/settlementApi";

function useSettlements(tripId) {
  const [settlementPayments, setSettlementPayments] = useState([]);
  const [savingSettlement, setSavingSettlement] = useState(false);

  const loadSettlements = async () => {
    try {
      const data = await getSettlementByTripId(tripId);

      if (Array.isArray(data)) {
        setSettlementPayments(data);
      } else {
        setSettlementPayments([]);
      }
    } catch (error) {
      console.error("Error loading settlement payments: ", error);
      setSettlementPayments([]);
    }
  };

  useEffect(() => {
    if (tripId) loadSettlements();
  }, [tripId]);

  const handleCreateSettlement = async (settlement) => {
    try {
      setSavingSettlement(true);

      await createSettlement(tripId, settlement);
      await loadSettlements();
    } catch (error) {
      console.error("Error creating settlement", error);
    } finally {
      setSavingSettlement(false);
    }
  };

  const handleUndoSettlement = async (id) => {
    try {
      await deleteSettlement(id);
      await loadSettlements();
    } catch (error) {
      console.error("Error undoing settlement: ", error);
    }
  };

  return {
    settlementPayments,
    savingSettlement,
    loadSettlements,
    handleCreateSettlement,
    handleUndoSettlement,
  };
}

export default useSettlements;
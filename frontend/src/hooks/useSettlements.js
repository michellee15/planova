import { useEffect, useState } from "react";
import { getSettlementByTripId, createSettlement, deleteSettlement } from "../api/settlementApi";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";

function useSettlements(tripId) {
  const confirm = useConfirmDialog();
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
    if (!tripId) return undefined;
    let active = true;
    getSettlementByTripId(tripId)
      .then((data) => {
        if (active) setSettlementPayments(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error loading settlement payments: ", error);
        if (active) setSettlementPayments([]);
      });
    return () => {
      active = false;
    };
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
    const shouldUndo = await confirm({
      title: "Undo this payment?",
      description:
        "The payment will be removed and everyone’s balances will be recalculated.",
      confirmLabel: "Undo payment",
      destructive: true,
    });
    if (!shouldUndo) return;

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

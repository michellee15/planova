import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTripById } from "../api/tripApi";

import TripHeader from "../components/tripDetails/TripHeader";
import TripOverview from "../components/tripDetails/TripOverview";
import BudgetSummary from "../components/tripDetails/BudgetSummary";
import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";
import useExpenses from "../hooks/useExpenses";
import MemberForm from "../components/members/MemberForm";
import MemberList from "../components/members/MemberList";
import useMembers from "../hooks/useMembers";
import SplitSummary from "../components/splits/SplitSummary";
import useSettlements from "../hooks/useSettlements";
import SettlementHistory from "../components/splits/SettlementHistory";

import {
  calculateBalances,
  calculateSettlements,
} from "../utils/splitCalculator";

function TripDetailsPage() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    expenses,
    expenseFormData,
    editingExpenseId,
    editExpenseFormData,
    handleExpenseChange,
    handleCreateExpense,
    handleDeleteExpense,
    handleStartEditExpense,
    handleEditExpenseChange,
    handleCancelEditExpense,
    handleEditExpense,
    handleSplitMemberChange,
    handleEditSplitMemberChange,
  } = useExpenses(id);

  const {
    members,
    memberFormData,
    handleMemberChange,
    handleCreateMember,
    handleDeleteMember,
  } = useMembers(id);

  const {
    settlementPayments,
    savingSettlement,
    handleCreateSettlement,
  } = useSettlements(id);

  useEffect(() => {
    const loadTripDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTripById(id);
        setTrip(data);
      } catch (error) {
        console.error("Error loading trip:", error);
        setError("Failed to load trip.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTripDetails();
    }
  }, [id]);

  if (loading) {
    return <p>Loading trip...</p>;
  }

  if (error) {
    return (
      <main>
        <Link to="/">Back to all trips</Link>
        <p>{error}</p>
      </main>
    );
  }

  if (!trip) {
    return (
      <main>
        <Link to="/">Back to all trips</Link>
        <p>Trip not found.</p>
      </main>
    );
  }

  const balances = calculateBalances(members, expenses, settlementPayments);
  const settlements = calculateSettlements(balances);

  return (
    <main>
      <Link to="/">Back to all trips</Link>

      <TripHeader trip={trip} />
      <TripOverview trip={trip} />
      <BudgetSummary trip={trip} expenses={expenses} />

      <section>
        <h2>Trip Members</h2>

        <MemberForm
          memberFormData={memberFormData}
          handleMemberChange={handleMemberChange}
          handleCreateMember={handleCreateMember}
        />

        <MemberList
          members={members}
          handleDeleteMember={handleDeleteMember}
        />
      </section>

      <section>
        <h2>Expenses</h2>

        <ExpenseForm
          formData={expenseFormData}
          onChange={handleExpenseChange}
          onSubmit={handleCreateExpense}
          members={members}
          onSplitMemberChange={handleSplitMemberChange}
        />

        <ExpenseList
          expenses={expenses}
          currency={trip.currency}
          members={members}
          editingExpenseId={editingExpenseId}
          editFormData={editExpenseFormData}
          onEditChange={handleEditExpenseChange}
          onStartEditExpense={handleStartEditExpense}
          onEditExpense={handleEditExpense}
          onCancelEditExpense={handleCancelEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onEditSplitMemberChange={handleEditSplitMemberChange}
        />

        <SplitSummary
          balances={balances}
          settlements={settlements}
          currency={trip.currency}
          onCreateSettlement={handleCreateSettlement}
          savingSettlement={savingSettlement}
        />

        <SettlementHistory
          settlementPayments={settlementPayments}
          currency={trip.currency}
        />
      </section>

      <section>
        <h2>Itinerary</h2>
        <p>No itinerary items yet.</p>
      </section>
    </main>
  );
}

export default TripDetailsPage;
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
import useItineraries from "../hooks/useItineraries";
import ItineraryForm from "../components/itineraries/ItineraryForm";
import ItineraryList from "../components/itineraries/ItineraryList";
import Icon from "../components/ui/Icon";

import {
  calculateBalances,
  calculateSettlements,
} from "../utils/splitCalculator";

const tabs = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "itinerary", label: "Itinerary", icon: "itinerary" },
  { id: "expenses", label: "Expenses", icon: "expenses" },
  { id: "members", label: "Members", icon: "users" },
];

function SectionIntro({ eyebrow, title, description, icon }) {
  return (
    <div className="section-intro">
      <span className="section-intro-icon">
        <Icon name={icon} size={21} />
      </span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {description && <span>{description}</span>}
      </div>
    </div>
  );
}

function TripDetailsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : "overview";

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
    handleUndoSettlement,
  } = useSettlements(id);

  const {
    itineraries,
    itineraryFormData,
    editingItineraryId,
    editItineraryFormData,
    handleItineraryChange,
    handleCreateItinerary,
    handleDeleteItinerary,
    handleStartEditItinerary,
    handleEditItineraryChange,
    handleCancelEditItinerary,
    handleEditItinerary,
    handleFindNearestItinerary,
    nearestItinerary,
    locationLoading,
    locationError,
    nearestTravelTimes,
    travelTimesLoading,
    travelTimesError,
  } = useItineraries(id);

  useEffect(() => {
    let active = true;
    getTripById(id)
      .then((data) => {
        if (active) setTrip(data);
      })
      .catch((requestError) => {
        console.error("Error loading trip:", requestError);
        if (active) setError("We couldn’t load this trip.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="trip-details-state">
        <span className="trip-loading-dot" />
        <p>Opening your trip journal…</p>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="trip-details-state">
        <span className="state-icon">
          <Icon name="map" size={30} />
        </span>
        <h1>{error ? "A little detour" : "Trip not found"}</h1>
        <p>{error || "This travel plan doesn’t seem to be here."}</p>
        <Link className="btn btn-primary" to="/">
          Back to my trips
        </Link>
      </main>
    );
  }

  const balances = calculateBalances(members, expenses, settlementPayments);
  const settlements = calculateSettlements(balances);

  return (
    <main className="trip-details-page">
      <Link className="trip-back-link" to="/">
        <Icon name="arrowLeft" size={17} />
        All trips
      </Link>

      <TripHeader trip={trip} />

      <nav className="trip-tabs" aria-label="Trip details">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            type="button"
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
            {tab.id === "expenses" && expenses.length > 0 && (
              <span>{expenses.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="trip-tab-content">
        {activeTab === "overview" && (
          <div className="trip-overview-layout">
            <TripOverview trip={trip} />
            <BudgetSummary trip={trip} expenses={expenses} />
            <section className="overview-next-step">
              <div>
                <p className="page-eyebrow">A gentle next step</p>
                <h2>Keep the excitement going</h2>
                <p>
                  Add a few places to your itinerary, then invite your travel
                  companions so everyone can plan together.
                </p>
              </div>
              <button
                className="btn btn-soft"
                type="button"
                onClick={() => setSearchParams({ tab: "itinerary" })}
              >
                Build itinerary
                <Icon name="arrowRight" size={17} />
              </button>
            </section>
          </div>
        )}

        {activeTab === "itinerary" && (
          <section className="section-card itinerary-card-section">
            <SectionIntro
              eyebrow="Day by day"
              title="Your itinerary"
              description="Collect the places, timings, and little notes that make the trip yours."
              icon="itinerary"
            />
            <ItineraryForm
              itineraryFormData={itineraryFormData}
              handleItineraryChange={handleItineraryChange}
              handleCreateItinerary={handleCreateItinerary}
            />
            <ItineraryList
              itineraries={itineraries}
              editingItineraryId={editingItineraryId}
              editFormData={editItineraryFormData}
              onEditChange={handleEditItineraryChange}
              onStartEditItinerary={handleStartEditItinerary}
              onEditItinerary={handleEditItinerary}
              onCancelEditItinerary={handleCancelEditItinerary}
              onDeleteItinerary={handleDeleteItinerary}
              nearestItinerary={nearestItinerary}
              locationLoading={locationLoading}
              locationError={locationError}
              onFindNearestItinerary={handleFindNearestItinerary}
              nearestTravelTimes={nearestTravelTimes}
              travelTimesLoading={travelTimesLoading}
              travelTimesError={travelTimesError}
            />
          </section>
        )}

        {activeTab === "expenses" && (
          <div className="expenses-layout">
            <section className="section-card expenses-card">
              <SectionIntro
                eyebrow="Shared spending"
                title="Trip expenses"
                description="Add a cost once and keep every split easy to understand."
                icon="expenses"
              />
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
            </section>
            <div className="settlement-grid">
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
                onUndoSettlement={handleUndoSettlement}
              />
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <section className="section-card members-card">
            <SectionIntro
              eyebrow="Travel together"
              title="Trip members"
              description="Add everyone joining this adventure to make expense splitting simple."
              icon="users"
            />
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
        )}
      </div>
    </main>
  );
}

export default TripDetailsPage;

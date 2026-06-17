import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import { getTripById } from "../api/tripApi";
import { getExpensesByTripId } from "../api/expenseApi";
import TripHeader from "../components/tripDetails/TripHeader";
import TripOverview from "../components/tripDetails/TripOverview";
import BudgetSummary from "../components/tripDetails/BudgetSummary";

function TripDetailsPage() {
  const {id} = useParams();
  const [trip, setTrip] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const loadTripDetails = async () => {
      try {
        setLoading(true);
        const data = await getTripById(id);
        setTrip(data);
        const expenseData = await getExpensesByTripId(id);
        setExpenses(expenseData);
      } catch (error) {
        console.error("Error loading trip: ", error);
        setError("Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    const loadExpenses = async () => {
      try {
        const expenseData = await getExpensesByTripId(id);
  
        if (Array.isArray(expenseData)) {
          setExpenses(expenseData);
        } else {
          console.error("Expenses data is not an array:", expenseData);
          setExpenses([]);
        }
      } catch (error) {
        console.error("Error loading expenses:", error);
        setExpenses([]);
      }
    };

    loadTripDetails();
    loadExpenses();
  }, [id]);

  if (loading) return <p>Loading trip...</p>;

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

  return (
    <main>
      <Link to="/">Back to all trips</Link>
      <TripHeader trip={trip}/>
      <TripOverview trip={trip}/>
      <BudgetSummary trip={trip} expenses={expenses || []}/>
      <section>
        <h2>Expenses</h2>
        {expenses.length === 0 ? (
            <p>No expenses yet.</p>
          ): (
            expenses.map((expense) => (
              <article key={expense.id}>
                <h3>{expense.title}</h3>
                <p>{trip.currency}{expense.amount}</p>
                {expense.category && <p>Category: {expense.category}</p>}
                {expense.paid_by && <p>Paid by: {expense.paid_by}</p>}
                {expense.expense_date && (
                  <p>Date: {expense.expense_date.slice(0, 10)}</p>
                )}
              </article>
            ))
          )
        }
      </section>
      <section>
        <h2>Itinerary</h2>
        <p>No itinerary items yet.</p>
      </section>
    </main>
  );
}

export default TripDetailsPage;
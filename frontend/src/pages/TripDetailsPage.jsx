import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import { getTripById } from "../api/tripApi";
import { getExpensesByTripId } from "../api/expenseApi";

function TripDetailsPage() {
  const {id} = useParams();
  const [trip, setTrip] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);

  const loadExpenses = async () => {
    try {
      const data = await getExpensesByTripId(id);
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses: ", error);
    }
  }

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

    loadTripDetails();
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
      <h1>{trip.title}</h1>
      <p>{trip.destination}</p>
      <section>
        <h2>Trip Overview</h2>
        {trip.start_date && <p>Start date: {trip.start_date.slice(0,10)}</p>}
        {trip.end_date && <p>End date: {trip.end_date.slice(0,10)}</p>}
        <p>Budget: {trip.total_budget}</p>
        <p>Number of People: {trip.num_of_people}</p>
      </section>

      <section>
        <h2>Budget Summary</h2>
        <p>
          Total budget: {trip.currency} {trip.total_budget || 0}
        </p>
        <p>Spent: {trip.currency} 0</p>
        <p>Remaining: {trip.currency} {trip.total_budget || 0}</p>
      </section>
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
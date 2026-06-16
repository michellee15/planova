import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import { getTripById } from "../api/tripApi";

function TripDetailsPage() {
  const {id} = useParams();
  const [trip, setTrip] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setLoading(true);
        const data = await getTripById(id);
        setTrip(data);
      } catch (error) {
        console.error("Error loading trip: ", error);
        setError("Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
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
        <p>No expenses yet.</p>
      </section>

      <section>
        <h2>Itinerary</h2>
        <p>No itinerary items yet.</p>
      </section>
    </main>
  );
}

export default TripDetailsPage;
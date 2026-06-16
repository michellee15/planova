import { useEffect, useState } from "react";
import { createTrip, deleteTrip, updateTrip, getTripById, getTrips } from "../api/tripApi";

function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error("error loading trips: ", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title || !destination) { return; }

    try {
      const newTrip = await createTrip({title, destination, currency: "SGD", num_of_people: 1});
      setTrips([newTrip, ...trips]);
      setTitle("");
      setDestination("");
    } catch (error) {
      console.error("Error creating trip: ", error);
    }
  };

  if (loading) {
    return <p>Loading trips ...</p>
  }

  return (
    <main>
      <h1>Planova</h1>
      <h2>My Trips</h2>

      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Trip title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input 
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        />
        <button type="submit">Create Trip</button>
      </form>

      <section>
        {trips.length === 0 ? (
          <p>No trips yet.</p>
        ) : (
          trips.map((trip) => (
            <article key={trip.id}>
              <h3>{trip.title}</h3>
              <p>{trip.destination}</p>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default TripsPage;
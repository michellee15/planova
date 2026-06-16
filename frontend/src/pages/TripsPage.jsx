import { useEffect, useState } from "react";
import { createTrip, deleteTrip, updateTrip, getTrips } from "../api/tripApi";

function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingTripId, setEditingTripId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "", destination: "", start_date: "", end_date: "", currency: "SGD", num_of_people: 1,
  });

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
  
  const handleDeleteTrip = async (id) => {
    try {
      await deleteTrip(id);
      setTrips((prevTrip) => prevTrip.filter((trip) => trip.id !== id));
    } catch (error) {
      console.error("Error deleting trip: ", error);
    }
  };

  const handleStartEdit = (trip) => {
    setEditingTripId(trip.id);
    setEditFormData({
      title: trip.title || "", 
      destination: trip.destination || "", 
      start_date: trip.start_date ? trip.start_date.slice(0,10) : "", //slice(0,10) to ensure date is in YYYY-MM-DD format after postgres returns date
      end_date: trip.end_date ? trip.end_date.slice(0,10) : "",
      total_budget: trip.total_budget || "",
      currency: trip.currency || "SGD",
      num_of_people: trip.num_of_people || 1,
    });
  };

  const handleEditChange = (event) => {
    const {name, value} = event.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name] : value,
    }));
  };

  const handleCancelEdit = () => {
    setEditingTripId(null);
    setEditFormData({
      title: "", destination: "", start_date: "", end_date: "", total_budget: "", currency: "SGD", num_of_people: 1,
    });
  };

  const handleUpdateTrip = async (id) => {
    if (!editFormData.title || !editFormData.destination) return;

    try {
      const updatedTrip = await updateTrip(id, {
        ...editFormData,
        total_budget: editFormData.total_budget || null,
        num_of_people: Number(editFormData.num_of_people) || 1,
      });
      setTrips((prevTrip) => prevTrip.map((trip) =>(trip.id === id ? updatedTrip : trip)));
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating trip: ", error);
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
            {String(editingTripId) === String(trip.id) ? (
              <>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  placeholder="Trip title"
                />

                <input
                  type="text"
                  name="destination"
                  value={editFormData.destination}
                  onChange={handleEditChange}
                  placeholder="Destination"
                />

                <input
                  type="date"
                  name="start_date"
                  value={editFormData.start_date}
                  onChange={handleEditChange}
                />

                <input
                  type="date"
                  name="end_date"
                  value={editFormData.end_date}
                  onChange={handleEditChange}
                />

                <input
                  type="number"
                  name="total_budget"
                  value={editFormData.total_budget}
                  onChange={handleEditChange}
                  placeholder="Total budget"
                />

                <input
                  type="text"
                  name="currency"
                  value={editFormData.currency}
                  onChange={handleEditChange}
                  placeholder="Currency"
                />

                <input
                  type="number"
                  name="num_of_people"
                  value={editFormData.number_of_people}
                  onChange={handleEditChange}
                  placeholder="Number of people"
                  min="1"
                />

                <button onClick={() => handleUpdateTrip(trip.id)}>Save</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <h3>{trip.title}</h3>
                <p>{trip.destination}</p>

                {trip.start_date && (
                  <p>Start date: {trip.start_date.slice(0, 10)}</p>
                )}
                {trip.end_date && (
                  <p>End date: {trip.end_date.slice(0, 10)}</p>
                )}
                {trip.total_budget && (
                  <p>
                    Budget: {trip.currency} {trip.total_budget}
                  </p>
                )}
                <p>People: {trip.num_of_people}</p>

                <button type="button" onClick={() => handleStartEdit(trip)}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDeleteTrip(trip.id)}>
                  Delete
                </button>
              </>
            )}
          </article>
        ))
      )}
    </section>
    </main>
  )
}

export default TripsPage;
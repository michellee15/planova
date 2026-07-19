import ItineraryItem from "./ItineraryItem";

function ItineraryList({itineraries, handleDeleteItinerary}) {
  if (itineraries.length === 0) {
    return <p>No itineraries yet.</p>
  }
  return (
    <div>
      {itineraries.map((itinerary) => (
        <ItineraryItem
          key={itinerary.id}
          itinerary={itinerary}
          handleDeleteItinerary={handleDeleteItinerary}
        />
      ))}
    </div>
  );
}

export default ItineraryList;
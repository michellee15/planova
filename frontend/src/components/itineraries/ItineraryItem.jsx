function ItineraryItem({itinerary, handleDeleteItinerary}) {
  return (
    <div>
      <p>{itinerary.title}</p>
      <button
      type="button"
      onClick={() => handleDeleteItinerary(itinerary.id)}
      >
        Delete
      </button>
    </div>
  );
}

export default ItineraryItem;
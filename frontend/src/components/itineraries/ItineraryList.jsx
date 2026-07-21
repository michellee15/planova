import ItineraryItem from "./ItineraryItem";

function ItineraryList({itineraries, editingItineraryId, editFormData, onEditChange, onStartEditItinerary, onEditItinerary, onCancelEditItinerary, onDeleteItinerary}) {
  if (itineraries.length === 0) {
    return <p>No itineraries yet.</p>
  }
  return (
    <div>
      {itineraries.map((itinerary) => (
        <ItineraryItem
          key={itinerary.id}
          itinerary={itinerary}
          isEditing={String(editingItineraryId) === String(itinerary.id)}
          editFormData={editFormData}
          onEditChange={onEditChange}
          onStartEditItinerary={onStartEditItinerary}
          onEditItinerary={onEditItinerary}
          onCancelEditItinerary={onCancelEditItinerary}
          onDeleteItinerary={onDeleteItinerary}
        />
      ))}
    </div>
  );
}

export default ItineraryList;
function ItineraryItem({itinerary, isEditing, editFormData, onEditChange, onStartEditItinerary, onEditItinerary, onCancelEditItinerary, onDeleteItinerary}) {
  if (isEditing) {
    return (
      <article>
        <input
          type="text"
          name="title"
          value={editFormData.title}
          onChange={onEditChange}
          placeholder="Itinerary Title"
        />
        <input 
          type="date"
          name="itinerary_date"
          value={editFormData.itinerary_date}
          onChange={onEditChange}
          placeholder="Itinerary Date"
        />
        <input 
          type="time"
          name="start_time"
          value={editFormData.start_time}
          onChange={onEditChange}
          placeholder="Start Time"
        />
        <input 
          type="time"
          name="end_time"
          value={editFormData.end_time}
          onChange={onEditChange}
          placeholder="End Time"
        />
        <input
          type="text"
          name="location"
          value={editFormData.location}
          onChange={onEditChange}
          placeholder="Location"
        />
        <input
          type="notes"
          name="notes"
          value={editFormData.notes}
          onChange={onEditChange}
          placeholder="Notes"
        />
        <button type="button" onClick={() => onEditItinerary(itinerary.id)}>
          Save
        </button>
        <button type="button" onClick={onCancelEditItinerary}>
          Cancel
        </button>
      </article>
    );
  }

  return (
    <article>
      <h3>{itinerary.title}</h3>
      <p>{itinerary.itinerary_date}</p>
      <p>
        {itinerary.start_time} - {itinerary.end_time}
      </p>
      <p>{itinerary.location}</p>
      <p>{itinerary.notes}</p>
  
      <button type="button" onClick={() => onStartEditItinerary(itinerary)}>
        Edit
      </button>
  
      <button type="button" onClick={() => onDeleteItinerary(itinerary.id)}>
        Delete
      </button>
    </article>
  );
}

export default ItineraryItem;
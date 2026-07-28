function ItineraryItem({
  itinerary,
  isEditing,
  editFormData,
  onEditChange,
  onStartEditItinerary,
  onEditItinerary,
  onCancelEditItinerary,
  onDeleteItinerary,
}) {
  if (isEditing) {
    return (
      <article className="item-card itinerary-card">
        <div className="form-grid">
          <input
            type="text"
            name="title"
            value={editFormData.title}
            onChange={onEditChange}
            placeholder="Itinerary title"
          />

          <input
            type="date"
            name="itinerary_date"
            value={editFormData.itinerary_date}
            onChange={onEditChange}
          />

          <input
            type="time"
            name="start_time"
            value={editFormData.start_time}
            onChange={onEditChange}
          />

          <input
            type="time"
            name="end_time"
            value={editFormData.end_time}
            onChange={onEditChange}
          />

          <input
            className="full-width"
            type="text"
            name="location"
            value={editFormData.location}
            onChange={onEditChange}
            placeholder="Location"
          />

          <textarea
            className="full-width"
            name="notes"
            value={editFormData.notes}
            onChange={onEditChange}
            placeholder="Notes"
          />
        </div>

        <div className="form-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onEditItinerary(itinerary.id)}
          >
            Save
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancelEditItinerary}
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="item-card itinerary-card">
      <div className="item-card-header">
        <div>
          <h3 className="item-card-title">{itinerary.title}</h3>

          <p className="item-card-meta">
            {itinerary.itinerary_date || "No date"}
          </p>
        </div>

        {(itinerary.start_time || itinerary.end_time) && (
          <span className="itinerary-time">
            {itinerary.start_time || "--:--"} - {itinerary.end_time || "--:--"}
          </span>
        )}
      </div>

      <div className="item-card-body">
      {itinerary.location && (
        <p className="itinerary-location">
          Location: {itinerary.location}
        </p>
      )}

      {itinerary.formatted_address && (
        <p className="itinerary-address">
          Address: {itinerary.formatted_address}
        </p>
      )}

      {itinerary.notes && <p>{itinerary.notes}</p>}
      </div>

      <div className="item-actions">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onStartEditItinerary(itinerary)}
        >
          Edit
        </button>

        <button
          className="btn btn-danger"
          type="button"
          onClick={() => onDeleteItinerary(itinerary.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default ItineraryItem;
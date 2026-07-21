function ItineraryForm({itineraryFormData, handleCreateItinerary, handleItineraryChange}) {
  return (
    <form className="form" onSubmit={handleCreateItinerary}>
      <div className="form-grid">
        <input 
          type="text"
          name="title"
          value={itineraryFormData.title}
          onChange={handleItineraryChange}
          placeholder="Itinerary name"
        />
        <input
          type="date"
          name="itinerary_date"
          value={itineraryFormData.itinerary_date}
          onChange={handleItineraryChange}
        />
        <input
          type="time"
          name="start_time"
          value={itineraryFormData.start_time}
          onChange={handleItineraryChange}
        />
        <input
          type="time"
          name="end_time"
          value={itineraryFormData.end_time}
          onChange={handleItineraryChange}
        />
        <input className="full-width"
          type="text"
          name="location"
          value={itineraryFormData.location}
          onChange={handleItineraryChange}
          placeholder="Location"
        />
        <textarea className="full-width"
          name="notes"
          value={itineraryFormData.notes}
          onChange={handleItineraryChange}
          placeholder="Notes"
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Add Itinerary</button>
      </div>
    </form>
  );
}

export default ItineraryForm;
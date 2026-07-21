function ItineraryForm({itineraryFormData, handleCreateItinerary, handleItineraryChange}) {
  return (
    <form onSubmit={handleCreateItinerary}>
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
      <input
        type="text"
        name="location"
        value={itineraryFormData.location}
        onChange={handleItineraryChange}
        placeholder="Location"
      />
      <textarea
        name="notes"
        value={itineraryFormData.notes}
        onChange={handleItineraryChange}
        placeholder="Notes"
      />
      <button type="submit">Add Itinerary</button>
    </form>
  );
}

export default ItineraryForm;
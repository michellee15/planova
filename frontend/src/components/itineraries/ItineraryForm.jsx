import {
  getDateRangeHelp,
  hasCompleteDateRange,
} from "../../utils/dateRange";

function ItineraryForm({
  itineraryFormData,
  handleCreateItinerary,
  handleItineraryChange,
  dateRange,
  error,
}) {
  const hasTripDates = hasCompleteDateRange(dateRange);

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
          id="itinerary-date"
          type="date"
          name="itinerary_date"
          value={itineraryFormData.itinerary_date}
          onChange={handleItineraryChange}
          min={dateRange.startDate || undefined}
          max={dateRange.endDate || undefined}
          aria-describedby="itinerary-date-help"
          disabled={!hasTripDates}
          required
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
        <p className="form-help full-width" id="itinerary-date-help">
          {getDateRangeHelp(dateRange)}
        </p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!hasTripDates}
        >
          Add Itinerary
        </button>
      </div>
    </form>
  );
}

export default ItineraryForm;

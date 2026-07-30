import ItineraryItem from "./ItineraryItem";
import { formatDistance } from "../../utils/preferences";

function ItineraryList({itineraries, editingItineraryId, editFormData, onEditChange, onStartEditItinerary, onEditItinerary, onCancelEditItinerary,
  onDeleteItinerary, nearestItinerary, locationLoading, locationError, onFindNearestItinerary, nearestTravelTimes, travelTimesLoading, travelTimesError,
  dateRange, editError}) {
  return (
    <>
      <div className="itinerary-location-tools">
        <button
          className="btn btn-secondary"
          type="button"
          onClick={onFindNearestItinerary}
          disabled={locationLoading || travelTimesLoading}
        >
          {locationLoading
            ? "Checking location..."
            : travelTimesLoading
              ? "Loading travel times..."
              : "Find nearest itinerary"}
        </button>

        {locationError && <p className="error-text">{locationError}</p>}

        {nearestItinerary && (
          <div className="nearest-itinerary-card">
            <p>
              Nearest stop: <strong>{nearestItinerary.location}</strong>
            </p>
            {travelTimesLoading && <p>Loading travel times...</p>}
            {travelTimesError && (
              <p className="error-text">{travelTimesError}</p>
            )}

            {nearestTravelTimes && (
              <>
                {nearestTravelTimes.distanceKm != null && (
                  <p>Distance: {formatDistance(nearestTravelTimes.distanceKm)}</p>
                )}

                {nearestTravelTimes.grabMinutes != null && (
                  <p>Grab/car: ~{nearestTravelTimes.grabMinutes} min</p>
                )}

                {nearestTravelTimes.publicTransportMinutes != null && (
                  <p>
                    Public transport: ~
                    {nearestTravelTimes.publicTransportMinutes} min
                  </p>
                )}

                {nearestTravelTimes.walkingMinutes != null && (
                  <p>Walk: ~{nearestTravelTimes.walkingMinutes} min</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {itineraries.length === 0 ? (
        <p className="empty-state">No itineraries yet.</p>
      ) : (
        <div className="itinerary-timeline">
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
              dateRange={dateRange}
              editError={editError}
            />
          ))}
        </div>
      )}
    </>
  );
}
export default ItineraryList;

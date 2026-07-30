import Icon from "../ui/Icon";
import { formatDisplayDate } from "../../utils/preferences";

function TripHeader({ trip }) {
  const start = formatDisplayDate(trip.start_date);
  const end = formatDisplayDate(trip.end_date);

  return (
    <header className="trip-hero">
      <div className="trip-hero-content">
        <span className="trip-hero-icon">
          <Icon name="map" size={29} />
        </span>
        <div>
          <p className="trip-hero-label">Your travel journal</p>
          <h1>{trip.title}</h1>
          <p className="trip-hero-destination">
            <Icon name="pin" size={17} />
            {trip.destination}
          </p>
          <div className="trip-hero-meta">
            <span>
              <Icon name="calendar" size={16} />
              {start && end ? `${start} – ${end}` : start || "Dates to be decided"}
            </span>
            <span>
              <Icon name="users" size={16} />
              {trip.num_of_people || 1} traveller
              {Number(trip.num_of_people) === 1 ? "" : "s"}
            </span>
            <span>
              <Icon name="wallet" size={16} />
              {trip.currency || "SGD"}
            </span>
          </div>
        </div>
      </div>
      <div className="trip-hero-decoration" aria-hidden="true">
        <span className="trip-hero-sun" />
        <span className="trip-hero-mountain trip-hero-mountain-back" />
        <span className="trip-hero-mountain trip-hero-mountain-front" />
        <span className="trip-hero-route" />
      </div>
    </header>
  );
}

export default TripHeader;

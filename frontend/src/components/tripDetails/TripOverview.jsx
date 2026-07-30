import Icon from "../ui/Icon";
import { formatDisplayDate } from "../../utils/preferences";

function TripOverview({ trip }) {
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;
  const validDates =
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime());
  const tripDays = validDates
    ? Math.max(
        1,
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1,
      )
    : "—";

  const stats = [
    {
      icon: "calendar",
      label: "Starts",
      value: formatDisplayDate(trip.start_date) || "Not set",
    },
    {
      icon: "calendar",
      label: "Ends",
      value: formatDisplayDate(trip.end_date) || "Not set",
    },
    { icon: "clock", label: "Duration", value: tripDays === "—" ? "Not set" : `${tripDays} days` },
    {
      icon: "users",
      label: "Travellers",
      value: `${trip.num_of_people || 1} people`,
    },
  ];

  return (
    <section className="dashboard-card overview-card">
      <div className="dashboard-card-header">
        <div>
          <p className="dashboard-card-eyebrow">At a glance</p>
          <h2>Trip overview</h2>
        </div>
        <span className="dashboard-card-icon">
          <Icon name="overview" size={20} />
        </span>
      </div>
      <div className="overview-stat-grid">
        {stats.map((stat) => (
          <div className="overview-stat" key={stat.label}>
            <span className="overview-stat-icon">
              <Icon name={stat.icon} size={18} />
            </span>
            <span className="overview-stat-label">{stat.label}</span>
            <span className="overview-stat-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TripOverview;

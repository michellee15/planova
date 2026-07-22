function TripOverview({ trip }) {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const tripDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="dashboard-card overview-card">
      <div className="dashboard-card-header">
        <div>
          <p className="dashboard-card-eyebrow">
            At a glance
          </p>

          <h2>Trip Overview</h2>
        </div>
      </div>

      <div className="overview-stat-grid">

        <div className="overview-stat">
          <span className="overview-stat-icon">
            📆
          </span>

          <span className="overview-stat-label">
            Start Date
          </span>

          <span className="overview-stat-value">
            {formatDate(trip.start_date)}
          </span>
        </div>

        <div className="overview-stat">
          <span className="overview-stat-icon">
            📆
          </span>

          <span className="overview-stat-label">
            End Date
          </span>

          <span className="overview-stat-value">
            {formatDate(trip.end_date)}
          </span>
        </div>

        <div className="overview-stat">
          <span className="overview-stat-icon">
            ⏳
          </span>

          <span className="overview-stat-label">
            Days
          </span>

          <span className="overview-stat-value">
            {tripDays}
          </span>
        </div>

        <div className="overview-stat">
          <span className="overview-stat-icon">
            👥
          </span>

          <span className="overview-stat-label">
            People
          </span>

          <span className="overview-stat-value">
            {trip.num_of_people}
          </span>
        </div>

      </div>
    </section>
  );
}

export default TripOverview;
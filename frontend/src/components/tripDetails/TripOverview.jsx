function TripOverview({trip}) {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const tripDays = Math.ceil((endDate-startDate)/(1000*60*60*24)) + 1; //converts millisecond to days
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }
  return (
    <section>
      <h2>Trip Overview</h2>
      <p>Start Date: {formatDate(trip.start_date)}</p>
      <p>End Date: {formatDate(trip.end_date)}</p>
      <p>Days: {tripDays}</p>
      <p>Number of people: {trip.num_of_people}</p>
    </section>
  )
}

export default TripOverview;
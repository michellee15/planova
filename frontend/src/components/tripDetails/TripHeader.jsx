function TripHeader({trip}) {
  return (
    <header>
      <h1>{trip.title}</h1>
      <p>{trip.destination}</p>
      <p>
        {trip.start_date && trip.start_date.slice(0, 10)}
        {" - "}
        {trip.end_date && trip.end_date.slice(0, 10)}
      </p>
      <p>Currency: {trip.currency}</p>
    </header>
  )
}

export default TripHeader;
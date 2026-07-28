//to obtain user's location from the browser
export const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const earthRadKm = 6371;
  const toRadians= (degree) => {
    return degree * (Math.PI/180);
  };
  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadKm * c;
};
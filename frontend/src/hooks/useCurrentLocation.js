import {useState} from "react";

function useCurrentLocation() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationLoading(false);
      setLocationError("Geolocation is not supported by this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationLoading(false);
    },
    (error) => {
      console.error("Error getting current location: ", error);
      setLocationError("Unable to get your location");
      setLocationLoading(false);
    });
  };

  return { currentLocation, locationLoading, locationError, getCurrentLocation };
}

export default useCurrentLocation;
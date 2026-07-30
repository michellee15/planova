import{useState, useEffect, useCallback} from "react";
import useCurrentLocation from "../hooks/useCurrentLocation";
import { calculateDistanceInKm } from "../utils/distanceUtils";
import { getTravelTimes } from "../api/routeApi";
import {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} from "../api/itineraryApi";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";

function useItineraries(tripId) {
  const confirm = useConfirmDialog();

  const [itineraries, setItineraries] = useState([]);
  const [itineraryFormData, setItineraryFormData] = useState({
    title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: ""
  });
  const [editingItineraryId, setEditingItineraryId] = useState(null);  
  const [editItineraryFormData, setEditItineraryFormData] = useState({
    title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: ""
  }); 

  const [nearestTravelTimes, setNearestTravelTimes] = useState(null);
  const [travelTimesLoading, setTravelTimesLoading] = useState(false);
  const [travelTimesError, setTravelTimesError] = useState("");
  const [nearestItinerary, setNearestItinerary] = useState(null);
  const {
    currentLocation,
    locationLoading,
    locationError,
    getCurrentLocation,
  } = useCurrentLocation();

  const loadItineraries = useCallback(async () => {
    try {
      const itineraryData = await getItineraryByTripId(tripId);
      if (Array.isArray(itineraryData)) {
        setItineraries(itineraryData);
      } else {
        console.error("Iitnerary data is not an array: ", itineraryData);
        setItineraries([]);
      }
    } catch (error){
      console.error("Error loading itineraries: ", error);
      setItineraries([]);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return undefined;
    const timeoutId = window.setTimeout(loadItineraries, 0);
    return () => window.clearTimeout(timeoutId);
  }, [tripId, loadItineraries]);

  useEffect(() => {
    const handleItineraryUpdated = (event) => {
      if (String(event.detail?.tripId) === String(tripId)) {
        loadItineraries();
      }
    };

    window.addEventListener("planova:itinerary-updated", handleItineraryUpdated);
    return () => {
      window.removeEventListener(
        "planova:itinerary-updated",
        handleItineraryUpdated,
      );
    };
  }, [tripId, loadItineraries]);

  useEffect(() => {
    let ignore = false;

    Promise.resolve().then(async () => {
      if (!currentLocation || ignore) return;

      const itineraryWithCoord = itineraries.filter((item) => {
        return item.latitude && item.longitude;
      });

      if (itineraryWithCoord.length === 0) {
        setNearestItinerary(null);
        setNearestTravelTimes(null);
        return;
      }
      const itemsWithDistance = itineraryWithCoord.map((item) => {
        const distance = calculateDistanceInKm(
          currentLocation.latitude,
          currentLocation.longitude,
          Number(item.latitude),
          Number(item.longitude)
        );

        return {
          ...item,
          distance,
        };
      });

      const nearest = itemsWithDistance.sort((a, b) => a.distance - b.distance)[0];
      setNearestItinerary(nearest);

      try {
        setTravelTimesLoading(true);
        setTravelTimesError("");
        setNearestTravelTimes(null);
        const travelTimes = await getTravelTimes({
          origin: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          destination: {
            latitude: Number(nearest.latitude),
            longitude: Number(nearest.longitude),
          },
        });
        if (!ignore) setNearestTravelTimes(travelTimes);
      } catch (error) {
        console.error("Error loading travel times: ", error);
        if (!ignore) setTravelTimesError("Failed to load travel times");
      } finally {
        if (!ignore) setTravelTimesLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [currentLocation, itineraries]);

  const handleItineraryChange = (event) => {
    const {name, value} = event.target;
    setItineraryFormData((prevData) => ({
      ...prevData, [name]: value,
    }));
  };

  const handleCreateItinerary = async(event) => {
    event.preventDefault();
    if (!itineraryFormData.title || !itineraryFormData.itinerary_date) return;
    try {
      await createItinerary(tripId, {
        title: itineraryFormData.title,
        location: itineraryFormData.location || null,
        itinerary_date: itineraryFormData.itinerary_date,
        start_time: itineraryFormData.start_time || null,
        end_time: itineraryFormData.end_time || null,
        notes: itineraryFormData.notes || null,
      })
      await loadItineraries();
      setItineraryFormData({
        title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: "",
      })
    } catch (error){
      console.error("Error creating itinerary: ", error)
    }
  };

  const handleDeleteItinerary = async (id) => {
    const itinerary = itineraries.find(
      (item) => String(item.id) === String(id),
    );
    const shouldDelete = await confirm({
      title: `Delete “${itinerary?.title || "this itinerary item"}”?`,
      description: "This stop and its saved notes will be permanently removed.",
      confirmLabel: "Delete itinerary",
      destructive: true,
    });
    if (!shouldDelete) return;

    try {
      await deleteItinerary(id);
      await loadItineraries();
    } catch (error) {
      console.error("Error deleting itinerary: ", error);
    }
  }

  //function that saves edited data to backend 
  const handleEditItineraryChange = (event) => {
    const {name, value} = event.target;
    setEditItineraryFormData((prevData) => ({
      ...prevData, [name]: value,
    }));
  }

  const handleEditItinerary = async (itineraryId) => {
    if (!editItineraryFormData.title || !editItineraryFormData.itinerary_date) return;
    try {
      await updateItinerary(itineraryId, {
        title: editItineraryFormData.title,
        location: editItineraryFormData.location || null,
        itinerary_date: editItineraryFormData.itinerary_date,
        start_time: editItineraryFormData.start_time || null,
        end_time: editItineraryFormData.end_time || null,
        notes: editItineraryFormData.notes || null
      });
      await loadItineraries();
      setEditingItineraryId(null);
      setEditItineraryFormData({title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: ""})
    } catch (error) {
      console.error("Error updating itinerary: ", error);
    }
  }

  const handleStartEditItinerary = async (itinerary) => {
    try {
      setEditingItineraryId(itinerary.id);
      setEditItineraryFormData({
        title: itinerary.title || "",
        location: itinerary.location || "",
        itinerary_date: itinerary.itinerary_date ? itinerary.itinerary_date.slice(0,10) : "",
        start_time: itinerary.start_time || "",
        end_time: itinerary.end_time || "",
        notes: itinerary.notes || "",
      });
    } catch (error) {
      console.error("Error updating itinerary: ", error);
    }
  }

  const handleCancelEditItinerary= () => {
    setEditingItineraryId(null);
    setEditItineraryFormData({title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: ""});
  }

  const handleFindNearestItinerary = () => {
    getCurrentLocation();
  }

  return {
    itineraries, setItineraries, itineraryFormData, setItineraryFormData, editingItineraryId, setEditingItineraryId, editItineraryFormData, 
    setEditItineraryFormData, loadItineraries, handleItineraryChange, handleCreateItinerary, handleDeleteItinerary, handleEditItineraryChange, 
    handleEditItinerary, handleStartEditItinerary, handleCancelEditItinerary, handleFindNearestItinerary, nearestItinerary, locationLoading, 
    locationError, nearestTravelTimes, travelTimesLoading, travelTimesError,
  };
}

export default useItineraries;

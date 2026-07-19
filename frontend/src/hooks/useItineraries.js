import{useState, useEffect} from "react";
import {
  getItineraryByTripId,
  createItinerary,
  updateItinerary,
  deleteItinerary,
} from "../api/itineraryApi";

function useItinerary(tripId) {
  const [itineraries, setItineraries] = useState([]);
  const [itineraryFormData, setItineraryFormData] = useState({
    title: "", location: "", itinerary_date: "", start_time: "", end_time: "", notes: ""
  });

  const loadItineraries = async () => {
    try {
      const itineraryData = await getItineraryByTripId(tripId);
      if (Array.isArray(itineraryData)) {
        setItineraries(itineraryData);
      } else {
        console.error("Iitnerary data is not in array: ", error);
        setItineraries([]);
      }
    } catch (error){
      console.error("Error loading itineraries: ", error);
      setItineraries([]);
    }
  };

  useEffect(() => {
    if (tripId) loadItineraries()
  }, [tripId]);

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
    try {
      await deleteItinerary(id);
      await loadItineraries();
    } catch (error) {
      console.error("Error deleting itinerary: ", error);
    }
  }

  return {
    itineraries, setItineraries, itineraryFormData, setItineraryFormData, loadItineraries, handleItineraryChange, handleCreateItinerary, handleDeleteItinerary,
  }

}

export default useItinerary;
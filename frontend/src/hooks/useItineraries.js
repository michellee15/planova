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
  const [editingItineraryId, setEditingItineraryId] = useState(null);  
  const [editItineraryFormData, setEditItineraryFormData] = useState({
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


  return {
    itineraries, setItineraries, itineraryFormData, setItineraryFormData, editingItineraryId, setEditingItineraryId, editItineraryFormData, 
    setEditItineraryFormData, loadItineraries, handleItineraryChange, handleCreateItinerary, handleDeleteItinerary, handleEditItineraryChange, 
    handleEditItinerary, handleStartEditItinerary, handleCancelEditItinerary,
  }

}

export default useItinerary;
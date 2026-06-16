import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripsPage />}/>
        <Route path="/trips/:id" element={<TripDetailsPage />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
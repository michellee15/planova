import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import './index.css'
import './App.css'

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
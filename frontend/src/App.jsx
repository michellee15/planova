import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedAppLayout from "./components/AuthenticatedAppLayout";
import './index.css'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedAppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TripsPage/>} />
          <Route path="/trips/:id" element={<TripDetailsPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;

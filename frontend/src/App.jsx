import { BrowserRouter, Routes, Route } from "react-router-dom";
import TripsPage from "./pages/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedAppLayout from "./components/AuthenticatedAppLayout";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog";
import './index.css'
import './App.css'

function App() {
  return (
    <ConfirmDialogProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/register" element={<RegisterPage/>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedAppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TripsPage/>} />
            <Route path="/trips/:id" element={<TripDetailsPage/>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmDialogProvider>
  )
}

export default App;

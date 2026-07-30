import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/authenticationApi";
import Chatbot from "./chat/Chatbot";
import AppHeader from "./AppHeader";

function AuthenticatedAppLayout() {
  const navigate = useNavigate();
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user) => {
        if (!active) return;
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new CustomEvent("planova:user-updated"));
      })
      .catch((error) => {
        if (!active) return;

        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        console.error("Error refreshing user profile:", error);
      })
      .finally(() => {
        if (active) setProfileReady(true);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (!profileReady) {
    return (
      <main className="trip-details-state" aria-busy="true">
        <span className="trip-loading-dot" />
        <p>Refreshing your profile…</p>
      </main>
    );
  }

  return (
    <>
      <div className="authenticated-app">
        <AppHeader />
        <Outlet />
      </div>
      <Chatbot />
    </>
  );
}

export default AuthenticatedAppLayout;

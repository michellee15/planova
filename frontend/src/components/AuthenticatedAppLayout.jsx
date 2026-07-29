import { Outlet } from "react-router-dom";
import Chatbot from "./chat/Chatbot";
import AppHeader from "./AppHeader";

function AuthenticatedAppLayout() {
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

import { Outlet } from "react-router-dom";
import Chatbot from "./chat/Chatbot";

function AuthenticatedAppLayout() {
  return (
    <>
      <Outlet />
      <Chatbot />
    </>
  );
}

export default AuthenticatedAppLayout;

import { useNavigate } from "react-router-dom";
import useAuthentication from "../../hooks/useAuthentication";
import "../../styles/components/profile.css";

function UserMenu() {
  const {handleLogOut} = useAuthentication();
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return null;

  return (
    <div className="user-menu">
      <div className="user-menu-info">
        <span className="user-menu-name">{user.name}</span>
        <span className="user-menu-email">{user.email}</span>
      </div>

      <button type="button" onClick={handleLogOut}>
        Logout
      </button>
    </div>
  );
}

export default UserMenu;
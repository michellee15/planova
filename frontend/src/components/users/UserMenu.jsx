import useAuthentication from "../../hooks/useAuthentication";
import Icon from "../ui/Icon";
import "../../styles/components/profile.css";

function UserMenu() {
  const {handleLogOut} = useAuthentication();
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return null;

  return (
    <details className="user-menu">
      <summary>
        <span className="user-avatar">
          {(user.name || user.email || "P").charAt(0).toUpperCase()}
        </span>
        <span className="user-menu-name">{user.name || "Traveller"}</span>
      </summary>

      <div className="user-menu-popover">
        <div className="user-menu-info">
          <span className="user-avatar user-avatar-large">
            {(user.name || user.email || "P").charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{user.name || "Traveller"}</strong>
            <span className="user-menu-email">{user.email}</span>
          </div>
        </div>
        <button type="button" onClick={handleLogOut}>
          <Icon name="logout" size={17} />
          Log out
        </button>
      </div>
    </details>
  );
}

export default UserMenu;

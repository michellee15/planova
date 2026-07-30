import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useAuthentication from "../../hooks/useAuthentication";
import Icon from "../ui/Icon";
import "../../styles/components/profile.css";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function UserMenu() {
  const { handleLogOut } = useAuthentication();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    const handleUserUpdate = () => setUser(readUser());
    window.addEventListener("planova:user-updated", handleUserUpdate);
    return () =>
      window.removeEventListener("planova:user-updated", handleUserUpdate);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const initial = (user.name || user.email || "P").charAt(0).toUpperCase();
  const avatarStyle = {
    "--avatar-color": user.avatar_color || "#eea083",
  };

  return (
    <div className={`user-menu${isOpen ? " open" : ""}`} ref={menuRef}>
      <button
        className="user-menu-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="user-avatar" style={avatarStyle}>
          {initial}
        </span>
        <span className="user-menu-name">{user.name || "Traveller"}</span>
        <Icon className="user-menu-chevron" name="arrowRight" size={14} />
      </button>

      {isOpen && (
        <div className="user-menu-popover" role="menu">
          <div className="user-menu-info">
            <span className="user-avatar user-avatar-large" style={avatarStyle}>
              {initial}
            </span>
            <div>
              <strong>{user.name || "Traveller"}</strong>
              <span className="user-menu-email">{user.email}</span>
            </div>
          </div>

          <div className="user-menu-links">
            <Link
              role="menuitem"
              to="/settings"
              onClick={() => setIsOpen(false)}
            >
              <span>
                <Icon name="settings" size={17} />
              </span>
              <div>
                <strong>Settings</strong>
                <small>Profile, travel and assistant preferences</small>
              </div>
            </Link>
          </div>

          <button
            className="user-menu-logout"
            type="button"
            role="menuitem"
            onClick={handleLogOut}
          >
            <Icon name="logout" size={17} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

import { Link, useLocation } from "react-router-dom";
import Icon from "./ui/Icon";
import UserMenu from "./users/UserMenu";

function AppHeader() {
  const location = useLocation();
  const isTripsPage = location.pathname === "/";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link className="app-brand" to="/" aria-label="Planova home">
          <span className="app-brand-mark">
            <Icon name="logo" size={22} />
          </span>
          <span className="app-brand-copy">
            <span className="app-brand-name">Planova</span>
            <small className="app-brand-tagline">make memories, softly</small>
          </span>
        </Link>

        <nav className="app-nav" aria-label="Primary navigation">
          <Link
            className={`app-nav-link${isTripsPage ? " active" : ""}`}
            to="/"
          >
            <Icon name="trips" size={17} />
            My Trips
          </Link>
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}

export default AppHeader;

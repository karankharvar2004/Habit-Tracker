import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import API from "../api/api";
import momentumLogo from "../assets/momentum-logo.svg";

function Navbar({ darkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await API.post("/auth/logout", {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("habitTrackerTheme");
      navigate("/");
    }
  };

  return (
    <nav className="app-navbar">
      <div className="app-navbar__brand">
        <img className="app-navbar__logo" src={momentumLogo} alt="Momentum logo" />
        <div>
          <p className="app-navbar__eyebrow">Build consistency with energy</p>
          <h1 className="app-navbar__title">Momentum</h1>
        </div>
      </div>

      <button
        type="button"
        className="app-navbar__toggle"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`app-navbar__panel ${menuOpen ? "is-open" : ""}`}
      >
        <div className="app-navbar__links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `app-navbar__link ${isActive ? "is-active" : ""}`
            }
            onClick={closeMenu}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `app-navbar__link ${isActive ? "is-active" : ""}`
            }
            onClick={closeMenu}
          >
            Profile
          </NavLink>
        </div>

        <div className="app-navbar__actions">
          <button
            type="button"
            className="app-navbar__theme"
            onClick={() => {
              closeMenu();
              onToggleTheme();
            }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            type="button"
            className="app-navbar__logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

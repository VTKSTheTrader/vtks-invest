import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ settings }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const getNavClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  const website = settings?.website || {};

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <NavLink
          to="/"
          className="brand-logo"
          onClick={closeMenu}
        >
          <span className="brand-vtks">VTKS</span>
          <span className="brand-hub">HUB</span>
        </NavLink>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div
          className={
            menuOpen
              ? "nav-links nav-links-open"
              : "nav-links"
          }
        >
          <NavLink
            to="/"
            className={getNavClass}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          {website.showFunds && (
            <NavLink
              to="/funds"
              className={getNavClass}
              onClick={closeMenu}
            >
              Analysis
            </NavLink>
          )}

          {website.showIndicators && (
            <NavLink
              to="/indicators"
              className={getNavClass}
              onClick={closeMenu}
            >
              Indicators
            </NavLink>
          )}

          <NavLink
            to="/pricing"
            className={getNavClass}
            onClick={closeMenu}
          >
            Pricing
          </NavLink>

          {website.showAccuracy && (
            <NavLink
              to="/accuracy"
              className={getNavClass}
              onClick={closeMenu}
            >
              Accuracy
            </NavLink>
          )}

          {website.showScanner && (
            <NavLink
              to="/resources"
              className={getNavClass}
              onClick={closeMenu}
            >
              Resources
            </NavLink>
          )}

          {website.showTestimonial && (
            <NavLink
              to="/testimonials"
              className={getNavClass}
              onClick={closeMenu}
            >
              Testimonials
            </NavLink>
          )}

          <NavLink
            to="/about"
            className={getNavClass}
            onClick={closeMenu}
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={getNavClass}
            onClick={closeMenu}
          >
            Contact
          </NavLink>

          <div className="mobile-auth-buttons">
            <NavLink
              to="/register"
              className="register-btn"
              onClick={closeMenu}
            >
              Register
            </NavLink>

            <NavLink
              to="/login"
              className="login-btn"
              onClick={closeMenu}
            >
              Login
            </NavLink>
          </div>
        </div>

        <div className="desktop-auth-buttons">
          <NavLink
            to="/register"
            className="register-btn"
          >
            Register
          </NavLink>

          <NavLink
            to="/login"
            className="login-btn"
          >
            Login
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
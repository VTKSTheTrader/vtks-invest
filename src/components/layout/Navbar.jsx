import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ settings }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const getNavClass = ({ isActive }) =>
    isActive
      ? "nav-link nav-link-active"
      : "nav-link";

  const website = settings?.website || {};

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        {/* Brand */}
        <NavLink
          to="/"
          className="brand-logo"
          onClick={closeMenu}
          aria-label="VTKS INVEST Home"
        >
          <div className="brand-content">
            <div className="brand-logo-main">
              <span className="brand-vtks">
                VTKS
              </span>

              <span className="brand-hub">
                INVEST
              </span>
            </div>

            <span className="brand-philosophy">
              Research • Knowledge • Strategy
            </span>
          </div>
        </NavLink>

        {/* Mobile menu button */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation */}
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

          {website.showMonthlyLevels && (
  <NavLink
    to="/monthly-levels"
    className={getNavClass}
    onClick={closeMenu}
  >
    Market Outlook
  </NavLink>
)}
{website.showAccuracy && (
            <NavLink
              to="/accuracy"
              className={getNavClass}
              onClick={closeMenu}
            >
              Accuracy
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

          {/* Mobile authentication buttons */}
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

        {/* Desktop authentication buttons */}
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
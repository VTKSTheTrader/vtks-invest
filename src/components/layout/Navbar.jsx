import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import vtksLogo from "../../pages/public/vtks-invest-logo.png";

import "./Navbar.css";

export default function Navbar({
  settings,
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [
    exploreOpen,
    setExploreOpen,
  ] = useState(false);

  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  const navbarRef = useRef(null);

  const location = useLocation();

  const website =
    settings?.website || {};

  const closeDropdowns = () => {
    setExploreOpen(false);
    setMoreOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    closeDropdowns();
  };

  const getNavClass = ({
    isActive,
  }) =>
    isActive
      ? "nav-link nav-link-active"
      : "nav-link";

  /* =========================================================
     ACTIVE DROPDOWN STATES
  ========================================================= */

  const exploreActive =
    location.pathname.startsWith(
      "/indicators"
    ) ||
    location.pathname.startsWith(
      "/pricing"
    );

  const moreActive =
    location.pathname.startsWith(
      "/resources"
    ) ||
    location.pathname.startsWith(
      "/ask-vtks"
    ) ||
    location.pathname.startsWith(
      "/answered-queries"
    ) ||
    location.pathname.startsWith(
      "/testimonials"
    ) ||
    location.pathname.startsWith(
      "/about"
    ) ||
    location.pathname.startsWith(
      "/contact"
    );

  /* =========================================================
     AVAILABLE DROPDOWN ITEMS
  ========================================================= */

  const showExplore =
    Boolean(
      website.showIndicators
    ) || true;

  const showMore =
    Boolean(
      website.showScanner
    ) ||
    Boolean(
      website.showAskVTKS
    ) ||
    Boolean(
      website.showTestimonial
    ) ||
    true;

  /* =========================================================
     CLOSE DROPDOWN WHEN ROUTE CHANGES
  ========================================================= */

  useEffect(() => {
    closeDropdowns();
    setMenuOpen(false);
  }, [location.pathname]);

  /* =========================================================
     CLICK OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target
        )
      ) {
        closeDropdowns();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeDropdowns();
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  return (
    <header className="navbar-header">
      <nav
        className="navbar"
        ref={navbarRef}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <NavLink
          to="/"
          className="navbar-brand"
          onClick={closeMenu}
        >
          <div className="brand-main-row">

            {/* SMALL CIRCULAR LOGO */}

            <div className="brand-logo-wrapper">

              <img
                src={vtksLogo}
                alt="VTKS Invest Logo"
                className="brand-logo"
              />

              <div className="logo-hover-preview">
                <img
                  src={vtksLogo}
                  alt="VTKS Invest Full Logo"
                />
              </div>

            </div>

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
        </NavLink>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => {
            setMenuOpen(
              (previous) =>
                !previous
            );

            closeDropdowns();
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen
            ? "✕"
            : "☰"}
        </button>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div
          className={
            menuOpen
              ? "nav-links nav-links-open"
              : "nav-links"
          }
        >

          {/* HOME */}

          <NavLink
            to="/"
            className={getNavClass}
            onClick={closeMenu}
            end
          >
            Home
          </NavLink>

          {/* ANALYSIS */}

          {website.showFunds && (
            <NavLink
              to="/funds"
              className={
                getNavClass
              }
              onClick={
                closeMenu
              }
            >
              Analysis
            </NavLink>
          )}

          {/* MARKET OUTLOOK */}

          {website.showMonthlyLevels && (
            <NavLink
              to="/monthly-levels"
              className={
                getNavClass
              }
              onClick={
                closeMenu
              }
            >
              Market Outlook
            </NavLink>
          )}

          {/* ACCURACY */}

          {website.showAccuracy && (
            <NavLink
              to="/accuracy"
              className={
                getNavClass
              }
              onClick={
                closeMenu
              }
            >
              Accuracy
            </NavLink>
          )}

          {/* =================================================
              EXPLORE DROPDOWN
          ================================================= */}

          {showExplore && (
            <div
              className={`nav-dropdown ${
                exploreOpen
                  ? "nav-dropdown-open"
                  : ""
              }`}
            >
              <button
                type="button"
                className={`nav-link nav-dropdown-trigger ${
                  exploreActive
                    ? "nav-link-active"
                    : ""
                }`}
                onClick={() => {
                  setExploreOpen(
                    (previous) =>
                      !previous
                  );

                  setMoreOpen(
                    false
                  );
                }}
                aria-expanded={
                  exploreOpen
                }
              >
                Explore

                <span
                  className={`nav-dropdown-arrow ${
                    exploreOpen
                      ? "nav-dropdown-arrow-open"
                      : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              <div className="nav-dropdown-menu">

                {website.showIndicators && (
                  <NavLink
                    to="/indicators"
                    className="nav-dropdown-item"
                    onClick={
                      closeMenu
                    }
                  >
                    <span className="nav-dropdown-icon">
                      📊
                    </span>

                    <span>
                      <strong>
                        Indicators
                      </strong>

                      <small>
                        VTKS indicator tools
                      </small>
                    </span>
                  </NavLink>
                )}

                <NavLink
                  to="/pricing"
                  className="nav-dropdown-item"
                  onClick={
                    closeMenu
                  }
                >
                  <span className="nav-dropdown-icon">
                    💳
                  </span>

                  <span>
                    <strong>
                      Pricing
                    </strong>

                    <small>
                      Membership plans
                    </small>
                  </span>
                </NavLink>

              </div>
            </div>
          )}

          {/* =================================================
              MORE DROPDOWN
          ================================================= */}

          {showMore && (
            <div
              className={`nav-dropdown ${
                moreOpen
                  ? "nav-dropdown-open"
                  : ""
              }`}
            >
              <button
                type="button"
                className={`nav-link nav-dropdown-trigger ${
                  moreActive
                    ? "nav-link-active"
                    : ""
                }`}
                onClick={() => {
                  setMoreOpen(
                    (previous) =>
                      !previous
                  );

                  setExploreOpen(
                    false
                  );
                }}
                aria-expanded={
                  moreOpen
                }
              >
                More

                <span
                  className={`nav-dropdown-arrow ${
                    moreOpen
                      ? "nav-dropdown-arrow-open"
                      : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              <div className="nav-dropdown-menu nav-dropdown-menu-more">

                {/* RESOURCES */}

                {website.showScanner && (
                  <NavLink
                    to="/resources"
                    className="nav-dropdown-item"
                    onClick={
                      closeMenu
                    }
                  >
                    <span className="nav-dropdown-icon">
                      📚
                    </span>

                    <span>
                      <strong>
                        Resources
                      </strong>

                      <small>
                        Scanners & learning resources
                      </small>
                    </span>
                  </NavLink>
                )}

                {/* ASK QUERY */}

                {website.showAskVTKS && (
                  <NavLink
                    to="/ask-vtks"
                    className="nav-dropdown-item"
                    onClick={
                      closeMenu
                    }
                  >
                    <span className="nav-dropdown-icon">
                      💬
                    </span>

                    <span>
                      <strong>
                        Ask Query
                      </strong>

                      <small>
                        Submit your stock question
                      </small>
                    </span>
                  </NavLink>
                )}

                {/* TESTIMONIALS */}

                {website.showTestimonial && (
                  <NavLink
                    to="/testimonials"
                    className="nav-dropdown-item"
                    onClick={
                      closeMenu
                    }
                  >
                    <span className="nav-dropdown-icon">
                      ⭐
                    </span>

                    <span>
                      <strong>
                        Testimonials
                      </strong>

                      <small>
                        Member experiences
                      </small>
                    </span>
                  </NavLink>
                )}

                {/* ABOUT */}

                <NavLink
                  to="/about"
                  className="nav-dropdown-item"
                  onClick={
                    closeMenu
                  }
                >
                  <span className="nav-dropdown-icon">
                    ℹ️
                  </span>

                  <span>
                    <strong>
                      About
                    </strong>

                    <small>
                      About VTKS
                    </small>
                  </span>
                </NavLink>

                {/* CONTACT */}

                <NavLink
                  to="/contact"
                  className="nav-dropdown-item"
                  onClick={
                    closeMenu
                  }
                >
                  <span className="nav-dropdown-icon">
                    ✉️
                  </span>

                  <span>
                    <strong>
                      Contact
                    </strong>

                    <small>
                      Get in touch
                    </small>
                  </span>
                </NavLink>

              </div>
            </div>
          )}

          {/* =================================================
              MOBILE AUTH
          ================================================= */}

          <div className="mobile-auth-buttons">

            <NavLink
              to="/register"
              className="register-btn"
              onClick={
                closeMenu
              }
            >
              Register
            </NavLink>

            <NavLink
              to="/login"
              className="login-btn"
              onClick={
                closeMenu
              }
            >
              Login
            </NavLink>

          </div>

        </div>

        {/* =================================================
            DESKTOP AUTH
        ================================================= */}

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
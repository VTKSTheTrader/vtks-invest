import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const closeSidebar = () =>
    setSidebarOpen(false);

  const handleLogout = () => {
    if (
      !window.confirm(
        "Are you sure you want to logout?"
      )
    ) {
      return;
    }

    localStorage.removeItem(
      "vtks_admin"
    );

    navigate("/login");
  };

  const menuItems = [
  {
    to: "/admin",
    label: "📊 Dashboard",
    end: true,
  },
  {
    to: "/admin/holdings",
    label: "📈 Holdings",
  },

  // =====================================================
  // ETF / SIP PORTFOLIO
  // =====================================================

  {
    to: "/admin/etf",
    label: "📊 ETF Portfolio",
  },

  {
    to: "/admin/monthly-levels",
    label: "📅 Monthly Levels",
  },

  // =====================================================
  // MEMBERS
  // =====================================================

  {
    to: "/admin/members",
    label: "👥 Members",
  },

  {
    to: "/admin/registered-users",
    label: "🧑‍💻 Registered Users",
  },

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  {
    to: "/admin/notifications",
    label: "🔔 Notifications",
  },

  {
    to: "/admin/expenses",
    label: "💰 Expenses",
  },

  {
    to: "/admin/stock-queries",
    label: "💬 Stock Queries",
  },

  {
    to: "/admin/scanner",
    label: "📡 Scanner",
  },

  {
    to: "/admin/library",
    label: "📚 Library",
  },

  {
    to: "/admin/community-links",
    label: "📢 Community Links",
  },

  {
    to: "/admin/testimonials",
    label: "⭐ Feedback",
  },

  {
    to: "/admin/settings",
    label: "⚙️ Settings",
  },
];
  return (
    <div className="admin-layout">

      {/* =================================================
          MOBILE HEADER
      ================================================= */}

      <header className="admin-mobile-header">

        <button
          type="button"
          className="admin-menu-btn"
          onClick={() =>
            setSidebarOpen(true)
          }
          aria-label="Open admin menu"
        >
          ☰
        </button>

        <strong>
          VTKS Control
        </strong>

      </header>

      {/* =================================================
          BACKDROP
      ================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          className="admin-backdrop"
          onClick={
            closeSidebar
          }
          aria-label="Close menu"
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`admin-sidebar ${
          sidebarOpen
            ? "open"
            : ""
        }`}
      >

        <h2>
          VTKS Control
        </h2>

        <nav>

          {menuItems.map(
            (item) => (
              <NavLink
                key={
                  item.to
                }
                to={
                  item.to
                }
                end={
                  item.end
                }
                onClick={
                  closeSidebar
                }
              >
                {
                  item.label
                }
              </NavLink>
            )
          )}

          <hr />

          <button
            type="button"
            className="logout-btn"
            onClick={() => {
              closeSidebar();
              handleLogout();
            }}
          >
            🚪 Logout
          </button>

        </nav>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">
        <Outlet />
      </main>

    </div>
  );
}
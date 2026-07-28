import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }

    localStorage.removeItem("vtks_admin");
    navigate("/login");
  };

  const menuItems = [
    { to: "/admin", label: "📊 Dashboard", end: true },
    { to: "/admin/holdings", label: "📈 Holdings" },
    { to: "/admin/members", label: "👥 Members" },
    { to: "/admin/scanner", label: "📡 Scanner" },
    { to: "/admin/library", label: "📚 Library" },
    {
      to: "/admin/community-links",
      label: "📢 Community Links",
    },
    {
      to: "/admin/testimonials",
      label: "⭐ Feedback",
    },
    { to: "/admin/settings", label: "⚙️ Settings" },
  ];

  return (
    <div className="admin-layout">
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>

        <strong>VTKS Control</strong>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-backdrop"
          onClick={closeSidebar}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <h2>VTKS Control</h2>

        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeSidebar}
            >
              {item.label}
            </NavLink>
          ))}

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

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

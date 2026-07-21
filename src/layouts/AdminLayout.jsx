import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("vtks_admin");
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>VTKS Control</h2>

        <nav>

          <NavLink to="/admin" end>
            📊 Dashboard
          </NavLink>

          <NavLink to="/admin/holdings">
            📈 Holdings
          </NavLink>

          <NavLink to="/admin/members">
            👥 Members
          </NavLink>

          <NavLink to="/admin/scanner">
            📡 Scanner
          </NavLink>

          <NavLink to="/admin/library">
            📚 Library
          </NavLink>

          
  <NavLink to="/admin/community-links">
    📢 Community Links
  </NavLink>


          <NavLink to="/admin/settings">
            ⚙️ Settings
          </NavLink>

          <hr />

          <button className="logout-btn" onClick={handleLogout}>
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
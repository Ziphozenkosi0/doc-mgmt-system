import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "reviewer", "manager", "finance_admin", "viewer"] },
  { to: "/upload", label: "Upload", roles: ["admin"] },
  { to: "/approvals", label: "Approvals", roles: ["admin", "reviewer", "manager", "finance_admin"] },
  { to: "/reports", label: "Reports", roles: ["admin", "finance_admin"] },
];

const ROLE_LABELS = {
  admin: "Admin",
  reviewer: "Reviewer",
  manager: "Manager",
  finance_admin: "Finance/Admin",
  viewer: "Viewer",
};

export default function Layout({ children }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">DM</span>
          <span className="sidebar-brand-name">Document Manager</span>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${location.pathname === item.to ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-email">{user?.email}</span>
            <span className="role-badge">{ROLE_LABELS[role] || role}</span>
          </div>
          <button onClick={logout} className="sidebar-logout">Log out</button>
        </div>
      </aside>

      <main className="content-area">{children}</main>
    </div>
  );
}
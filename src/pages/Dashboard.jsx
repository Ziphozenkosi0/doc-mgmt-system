import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Dashboard() {
  const { user, role, logout } = useAuth();

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Logged in as: {user?.email}</p>
      <p>Role: {role}</p>

      <nav style={{ display: "flex", gap: "12px", margin: "16px 0" }}>
        {(role === "admin" || role === "approver") && (
          <Link to="/upload">Upload Document</Link>
        )}
      </nav>

      <button onClick={logout}>Log out</button>

      <hr />
      <p style={{ color: "#888" }}>
        Approvals and reports will go here next.
      </p>
    </div>
  );
}

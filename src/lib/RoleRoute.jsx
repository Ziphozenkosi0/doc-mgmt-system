import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Wrap a page in this to require login AND a specific role.
// Usage: <RoleRoute allowed={["admin", "approver"]}><Upload /></RoleRoute>
export default function RoleRoute({ allowed, children }) {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) {
    return (
      <div className="page">
        <h2>Access denied</h2>
        <p>Your role ({role}) doesn't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

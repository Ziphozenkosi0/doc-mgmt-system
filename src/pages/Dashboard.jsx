import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const snapshot = await getDocs(collection(db, "documents"));
      const docs = snapshot.docs.map((d) => d.data());

      const counts = { pending: 0, approved: 0, rejected: 0 };
      docs.forEach((d) => {
        if (counts[d.status] !== undefined) counts[d.status]++;
      });

      setStats({ total: docs.length, ...counts });
      setLoading(false);
    }

    loadStats();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.email}.</p>

      {loading && <p style={{ color: "#888" }}>Loading stats...</p>}

      {stats && (
        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-label">Total Documents</span>
            <span className="summary-value">{stats.total}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Pending</span>
            <span className="summary-value" style={{ color: "#b45309" }}>{stats.pending}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Approved</span>
            <span className="summary-value" style={{ color: "#15803d" }}>{stats.approved}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Rejected</span>
            <span className="summary-value" style={{ color: "#dc2626" }}>{stats.rejected}</span>
          </div>
        </div>
      )}
    </div>
  );
}
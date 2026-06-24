import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchFilteredDocuments, summarizeDocuments } from "../lib/reportData";
import { exportToExcel, exportToPDF } from "../lib/export";
import { getAIInsights } from "../lib/aiInsights";

export default function Reports() {
  const [filters, setFilters] = useState({
    status: "",
    vendor: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  const [docs, setDocs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  function updateFilter(key, value) {
    setFilters({ ...filters, [key]: value });
  }

  async function handleRunReport() {
    setLoading(true);
    setInsights(null);
    try {
      const results = await fetchFilteredDocuments(filters);
      setDocs(results);
      setSummary(summarizeDocuments(results));
    } catch (err) {
      alert("Couldn't load report: " + err.message);
    }
    setLoading(false);
  }

  async function handleGetInsights() {
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const result = await getAIInsights(docs, summary);
      setInsights(result);
    } catch (err) {
      setInsightsError(err.message);
    }
    setInsightsLoading(false);
  }

  return (
    <div className="page">
      <Link to="/dashboard" style={{ fontSize: 13, color: "#2563eb" }}>← Back to Dashboard</Link>
      <h1>Reports</h1>
      <p>Filter documents by date, vendor, status, and amount, then export or get AI insights.</p>

      <div className="filters-grid">
        <label>
          Status
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label>
          Vendor
          <input
            type="text"
            placeholder="e.g. Vodacom"
            value={filters.vendor}
            onChange={(e) => updateFilter("vendor", e.target.value)}
          />
        </label>

        <label>
          Date from
          <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
        </label>

        <label>
          Date to
          <input type="date" value={filters.dateTo} onChange={(e) => updateFilter("dateTo", e.target.value)} />
        </label>

        <label>
          Min amount
          <input type="number" value={filters.amountMin} onChange={(e) => updateFilter("amountMin", e.target.value)} />
        </label>

        <label>
          Max amount
          <input type="number" value={filters.amountMax} onChange={(e) => updateFilter("amountMax", e.target.value)} />
        </label>
      </div>

      <button onClick={handleRunReport} disabled={loading} className="approve-button" style={{ marginTop: 12 }}>
        {loading ? "Loading..." : "Run Report"}
      </button>

      {summary && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">Documents</span>
              <span className="summary-value">{summary.count}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Amount</span>
              <span className="summary-value">{summary.totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total VAT</span>
              <span className="summary-value">{summary.totalVat.toFixed(2)}</span>
            </div>
          </div>

          <div className="approval-actions" style={{ marginBottom: 16 }}>
            <button onClick={() => exportToExcel(docs)} className="approve-button">Export Excel</button>
            <button onClick={() => exportToPDF(docs, summary)} className="approve-button">Export PDF</button>
            <button onClick={handleGetInsights} disabled={insightsLoading || docs.length === 0} className="approve-button">
              {insightsLoading ? "Analyzing..." : "Get AI Insights"}
            </button>
          </div>

          {insightsError && <p className="error">AI insights failed: {insightsError}</p>}
          {insights && (
            <div className="doc-card">
              <strong>AI Insights</strong>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{insights}</p>
            </div>
          )}

          <table className="report-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>VAT</th>
                <th>Invoice #</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.docType === "credit_note" ? "Credit Note" : "Invoice"}</td>
                  <td>{d.extracted?.vendor || "—"}</td>
                  <td>{d.extracted?.date || "—"}</td>
                  <td>{d.extracted?.amount ?? "—"}</td>
                  <td>{d.extracted?.vat ?? "—"}</td>
                  <td>{d.extracted?.invoiceNumber || "—"}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

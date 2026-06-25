import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import {
  canUserActOnDocument,
  approveDocument,
  rejectDocument,
  STAGE_LABELS,
} from "../lib/approvalWorkflow";
import { getSignedFileUrl } from "../lib/storage";

export default function Approvals() {
  const { user, role } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    // Listen for all pending documents — we filter client-side for "can this
    // user act on it" since that depends on role + history, not just a
    // simple field match Firestore can query directly.
    const q = query(
      collection(db, "documents"),
      where("status", "==", "pending"),
      orderBy("uploadedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setDocuments(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleViewFile(filePath) {
    try {
      const url = await getSignedFileUrl(filePath);
      window.open(url, "_blank");
    } catch (err) {
      alert("Couldn't open file: " + err.message);
    }
  }

  async function handleApprove(docItem) {
    setActioningId(docItem.id);
    try {
      await approveDocument(docItem.id, docItem, user.email, role);
    } catch (err) {
      alert("Approval failed: " + err.message);
    }
    setActioningId(null);
  }

  async function handleReject(docItem) {
    setActioningId(docItem.id);
    try {
      await rejectDocument(docItem.id, docItem, user.email, role, rejectReason[docItem.id]);
    } catch (err) {
      alert("Rejection failed: " + err.message);
    }
    setActioningId(null);
  }

  if (loading) return <div className="page"><p>Loading documents...</p></div>;

  const actionableDocs = documents.filter((d) => canUserActOnDocument(d, role, user.email));
  const waitingDocs = documents.filter((d) => !canUserActOnDocument(d, role, user.email));

  return (
    <div className="page">
      <p>Documents waiting on your review are shown first. Your role: <strong>{role}</strong></p>

      <h2>Awaiting your action ({actionableDocs.length})</h2>
      {actionableDocs.length === 0 && <p style={{ color: "#888" }}>Nothing waiting on you right now.</p>}

      {actionableDocs.map((docItem) => (
        <div key={docItem.id} className="doc-card">
          <div className="doc-card-header">
            <strong>{docItem.fileName}</strong>
            <span className="badge">Stage {docItem.approvalStage}: {STAGE_LABELS[docItem.approvalStage]}</span>
          </div>

          {docItem.isDuplicate && (
            <p className="warning">⚠ Possible duplicate detected</p>
          )}

          <div className="doc-details">
            <span>Type: {docItem.docType === "credit_note" ? "Credit Note" : "Invoice"}</span>
            {docItem.extracted && (
              <>
                <span>Vendor: {docItem.extracted.vendor || "—"}</span>
                <span>Date: {docItem.extracted.date || "—"}</span>
                <span>Amount: {docItem.extracted.amount ?? "—"}</span>
                <span>VAT: {docItem.extracted.vat ?? "—"}</span>
                <span>Invoice #: {docItem.extracted.invoiceNumber || "—"}</span>
              </>
            )}
          </div>

          <button onClick={() => handleViewFile(docItem.filePath)} className="link-button">
            View file
          </button>

          <div className="approval-actions">
            <button
              onClick={() => handleApprove(docItem)}
              disabled={actioningId === docItem.id}
              className="approve-button"
            >
              Approve
            </button>
            <input
              type="text"
              placeholder="Reason (optional, for rejection)"
              value={rejectReason[docItem.id] || ""}
              onChange={(e) =>
                setRejectReason({ ...rejectReason, [docItem.id]: e.target.value })
              }
            />
            <button
              onClick={() => handleReject(docItem)}
              disabled={actioningId === docItem.id}
              className="reject-button"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      <h2>Waiting on others ({waitingDocs.length})</h2>
      {waitingDocs.map((docItem) => (
        <div key={docItem.id} className="doc-card muted">
          <div className="doc-card-header">
            <strong>{docItem.fileName}</strong>
            <span className="badge">Stage {docItem.approvalStage}: {STAGE_LABELS[docItem.approvalStage]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

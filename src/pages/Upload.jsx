import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { uploadFile } from "../lib/storage";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("invoice"); // invoice | credit_note
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setError("");

    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only PDF, JPG, or PNG files are allowed.");
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB).");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatus("Uploading file...");

    try {
      // 1. Upload the actual file bytes (currently a placeholder — see storage.js)
      const uploaded = await uploadFile(file);

      setStatus("Saving document record...");

      // 2. Create the Firestore record that the rest of the app
      //    (extraction, approval, reports) will work from.
      await addDoc(collection(db, "documents"), {
        fileName: uploaded.fileName,
        filePath: uploaded.path,      // Supabase storage path — used to generate signed URLs later
        fileSize: uploaded.size,
        docType,                     // "invoice" | "credit_note"
        status: "pending",           // pending | approved | rejected
        approvalStage: 1,            // 1, 2, or 3
        approvalHistory: [],
        extracted: null,             // filled in later by Gemini extraction
        uploadedBy: user.email,
        uploadedAt: serverTimestamp(),
      });

      setStatus("Document uploaded successfully.");
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError("Something went wrong: " + err.message);
      setStatus("");
    }

    setSubmitting(false);
  }

  return (
    <div className="page">
      <h1>Upload Document</h1>
      <p>Upload an invoice or credit note. It will enter the approval workflow automatically.</p>

      <form onSubmit={handleSubmit} className="upload-form">
        {error && <p className="error">{error}</p>}
        {status && <p className="status">{status}</p>}

        <label>
          Document type
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="invoice">Invoice</option>
            <option value="credit_note">Credit Note</option>
          </select>
        </label>

        <label>
          File (PDF, JPG, or PNG)
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

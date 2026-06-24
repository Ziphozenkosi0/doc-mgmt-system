import { useState } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { uploadFile } from "../lib/storage";
import { extractDocumentData } from "../lib/extraction";
import { checkForDuplicates } from "../lib/duplicateCheck";

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
      // 1. Upload the actual file bytes to Supabase Storage.
      const uploaded = await uploadFile(file);

      setStatus("Saving document record...");

      // 2. Create the initial Firestore record (extraction not done yet).
      const docRef = await addDoc(collection(db, "documents"), {
        fileName: uploaded.fileName,
        filePath: uploaded.path,
        fileSize: uploaded.size,
        docType,
        status: "pending",
        approvalStage: 1,
        approvalHistory: [],
        extracted: null,
        duplicateOf: null,
        uploadedBy: user.email,
        uploadedAt: serverTimestamp(),
      });

      // 3. Run AI extraction (vendor, date, amount, VAT, invoice number).
      setStatus("Reading document with AI...");
      let extracted = null;
      let extractionError = null;
      try {
        extracted = await extractDocumentData(file, docType);
      } catch (err) {
        // Extraction failing shouldn't block the upload entirely — the
        // document still exists and can be reviewed/approved manually.
        extractionError = err.message;
      }

      // 4. Check for duplicates based on what was extracted.
      let duplicates = [];
      if (extracted) {
        setStatus("Checking for duplicates...");
        duplicates = await checkForDuplicates(extracted, docRef.id);
      }

      // 5. Update the Firestore record with extraction + duplicate results.
      await updateDoc(doc(db, "documents", docRef.id), {
        extracted,
        extractionError,
        isDuplicate: duplicates.length > 0,
        duplicateOf: duplicates.length > 0 ? duplicates[0].id : null,
      });

      if (duplicates.length > 0) {
        setStatus(
          `Document uploaded, but a possible duplicate was found (matched on ${duplicates[0].reason.replace("_", " ")}). Flagged for review.`
        );
      } else if (extractionError) {
        setStatus("Document uploaded, but AI extraction failed — it can still be reviewed manually.");
      } else {
        setStatus("Document uploaded and processed successfully.");
      }

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

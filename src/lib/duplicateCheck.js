// duplicateCheck.js — looks for existing documents that might be duplicates
// of the one just uploaded, based on invoice number (primary check) and
// vendor + amount (secondary, softer check).

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function checkForDuplicates(extracted, currentDocId) {
  const duplicates = [];

  if (extracted?.invoiceNumber) {
    const q = query(
      collection(db, "documents"),
      where("extracted.invoiceNumber", "==", extracted.invoiceNumber)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== currentDocId) {
        duplicates.push({ id: docSnap.id, reason: "invoice_number", ...docSnap.data() });
      }
    });
  }

  // Secondary check: same vendor + same amount (catches duplicates where the
  // invoice number was misread or missing, but skip if we already matched above).
  if (extracted?.vendor && extracted?.amount && duplicates.length === 0) {
    const q = query(
      collection(db, "documents"),
      where("extracted.vendor", "==", extracted.vendor),
      where("extracted.amount", "==", extracted.amount)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      if (docSnap.id !== currentDocId) {
        duplicates.push({ id: docSnap.id, reason: "vendor_and_amount", ...docSnap.data() });
      }
    });
  }

  return duplicates;
}

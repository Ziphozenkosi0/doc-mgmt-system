// reportData.js — fetches and filters documents for the Reports page.
// Filters: date range, vendor, status, amount range.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Fetches all documents once, then filters client-side. This keeps the
// filtering logic simple and flexible (combining filters arbitrarily is
// awkward in Firestore queries directly), and our document volume here
// is small enough that this is fine.
export async function fetchFilteredDocuments(filters) {
  const snapshot = await getDocs(collection(db, "documents"));
  let docs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  if (filters.status) {
    docs = docs.filter((d) => d.status === filters.status);
  }

  if (filters.vendor) {
    const search = filters.vendor.toLowerCase();
    docs = docs.filter((d) =>
      (d.extracted?.vendor || "").toLowerCase().includes(search)
    );
  }

  if (filters.dateFrom) {
    docs = docs.filter((d) => d.extracted?.date && d.extracted.date >= filters.dateFrom);
  }

  if (filters.dateTo) {
    docs = docs.filter((d) => d.extracted?.date && d.extracted.date <= filters.dateTo);
  }

  if (filters.amountMin !== "" && filters.amountMin != null) {
    docs = docs.filter(
      (d) => d.extracted?.amount != null && d.extracted.amount >= Number(filters.amountMin)
    );
  }

  if (filters.amountMax !== "" && filters.amountMax != null) {
    docs = docs.filter(
      (d) => d.extracted?.amount != null && d.extracted.amount <= Number(filters.amountMax)
    );
  }

  // Sort by date descending (most recent first), falling back to upload time
  // for documents where extraction didn't find a date.
  docs.sort((a, b) => {
    const dateA = a.extracted?.date || "";
    const dateB = b.extracted?.date || "";
    return dateB.localeCompare(dateA);
  });

  return docs;
}

// Simple aggregate numbers used both for the on-screen summary and as
// context fed into the AI insights call.
export function summarizeDocuments(docs) {
  const totalAmount = docs.reduce((sum, d) => sum + (d.extracted?.amount || 0), 0);
  const totalVat = docs.reduce((sum, d) => sum + (d.extracted?.vat || 0), 0);

  const byStatus = docs.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const byVendor = docs.reduce((acc, d) => {
    const vendor = d.extracted?.vendor || "Unknown";
    acc[vendor] = (acc[vendor] || 0) + (d.extracted?.amount || 0);
    return acc;
  }, {});

  return {
    count: docs.length,
    totalAmount,
    totalVat,
    byStatus,
    byVendor,
  };
}

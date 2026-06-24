// approvalWorkflow.js — encodes the 3-step approval process:
//   Stage 1: Reviewer  → approve/reject
//   Stage 2: Manager   → approve/reject
//   Stage 3: Finance/Admin → final approve/reject
//
// A document moves to the next stage only after being approved at the
// current one. Rejecting at any stage ends the workflow immediately.

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

// Which role is responsible for approving at each stage.
export const STAGE_ROLES = {
  1: "reviewer",
  2: "manager",
  3: "finance_admin",
};

export const STAGE_LABELS = {
  1: "Reviewer",
  2: "Manager",
  3: "Finance/Admin",
};

// Can this user act on this document right now?
// - Document must still be "pending" (not already approved/rejected)
// - The user's role must match the role responsible for the document's current stage
// - The user must not have already approved this same document at an earlier stage
//   (separation of duties — see approvalHistory check)
export function canUserActOnDocument(docData, userRole, userEmail) {
  if (docData.status !== "pending") return false;

  const requiredRole = STAGE_ROLES[docData.approvalStage];
  if (userRole !== requiredRole && userRole !== "admin") return false;

  // Separation of duties: block the same person from approving twice.
  const alreadyActed = (docData.approvalHistory || []).some(
    (entry) => entry.actedBy === userEmail
  );
  if (alreadyActed) return false;

  return true;
}

export async function approveDocument(documentId, docData, userEmail, userRole) {
  const currentStage = docData.approvalStage;
  const isFinalStage = currentStage === 3;

  const historyEntry = {
    stage: currentStage,
    role: userRole,
    action: "approved",
    actedBy: userEmail,
    actedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, "documents", documentId), {
    approvalStage: isFinalStage ? currentStage : currentStage + 1,
    status: isFinalStage ? "approved" : "pending",
    approvalHistory: arrayUnion(historyEntry),
  });
}

export async function rejectDocument(documentId, docData, userEmail, userRole, reason) {
  const historyEntry = {
    stage: docData.approvalStage,
    role: userRole,
    action: "rejected",
    actedBy: userEmail,
    actedAt: new Date().toISOString(),
    reason: reason || null,
  };

  await updateDoc(doc(db, "documents", documentId), {
    status: "rejected",
    approvalHistory: arrayUnion(historyEntry),
  });
}

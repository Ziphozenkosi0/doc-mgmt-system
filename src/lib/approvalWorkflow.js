// approvalWorkflow.js — encodes the 3-step approval process:
//   Stage 1: Reviewer  → approve/reject
//   Stage 2: Manager   → approve/reject
//   Stage 3: Finance/Admin → final approve/reject

import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

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

export function canUserActOnDocument(docData, userRole, userEmail) {
  if (docData.status !== "pending") return false;

  const requiredRole = STAGE_ROLES[docData.approvalStage];
  if (userRole !== requiredRole && userRole !== "admin") return false;

  
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

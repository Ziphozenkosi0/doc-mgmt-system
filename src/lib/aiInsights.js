// aiInsights.js — sends the current report's documents + summary to our
// Cloudflare Worker, which asks Groq to write a short plain-language
// analysis (trends, anomalies, recommendations).

const WORKER_URL = import.meta.env.VITE_EXTRACTION_WORKER_URL;

export async function getAIInsights(documents, summary) {
  // Only send the fields Groq actually needs — keeps the request small
  // and avoids sending unnecessary file paths/internal IDs.
  const trimmedDocs = documents.map((d) => ({
    extracted: d.extracted,
    status: d.status,
  }));

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "insights",
      documents: trimmedDocs,
      summary,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get AI insights");
  }

  return data.insights;
}

const WORKER_URL = import.meta.env.VITE_EXTRACTION_WORKER_URL;

export async function getAIInsights(documents, summary) {

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

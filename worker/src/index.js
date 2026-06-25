const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function callGroq(env, messages, jsonMode = false) {
  const body = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw { status: 502, error: "Groq API error", details: data };
  }
  return data.choices?.[0]?.message?.content || "";
}

async function handleExtract(env, payload) {
  const { fileBase64, mimeType, docType } = payload;

  if (!fileBase64 || !mimeType) {
    throw { status: 400, error: "Missing fileBase64 or mimeType" };
  }

  const prompt = `You are looking at a ${docType === "credit_note" ? "credit note" : "invoice"}.
Extract the following fields and return ONLY a valid JSON object, no other text, no markdown formatting:
{
  "vendor": "the vendor/supplier name, or null if not found",
  "date": "the document date in YYYY-MM-DD format, or null if not found",
  "amount": "the total amount as a number (no currency symbols), or null if not found",
  "vat": "the VAT/tax amount as a number, or null if not found",
  "invoiceNumber": "the invoice or credit note number, or null if not found"
}`;

  const rawText = await callGroq(
    env,
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
        ],
      },
    ],
    true
  );

  const cleanedText = rawText.replace(/```json|```/g, "").trim();
  try {
    return { extracted: JSON.parse(cleanedText) };
  } catch {
    throw { status: 502, error: "Could not parse Groq's response", raw: rawText };
  }
}

async function handleInsights(env, payload) {
  const { documents, summary } = payload;

  if (!documents || !summary) {
    throw { status: 400, error: "Missing documents or summary" };
  }

  const prompt = `You are a financial analyst reviewing a set of invoices and credit notes.
Here is the summary data:
- Total documents: ${summary.count}
- Total amount: ${summary.totalAmount}
- Total VAT: ${summary.totalVat}
- Breakdown by status: ${JSON.stringify(summary.byStatus)}
- Spend by vendor: ${JSON.stringify(summary.byVendor)}

Here is the list of individual documents (vendor, date, amount, VAT, status):
${documents.map((d) => `- ${d.extracted?.vendor || "Unknown"}, ${d.extracted?.date || "no date"}, amount ${d.extracted?.amount ?? "?"}, VAT ${d.extracted?.vat ?? "?"}, status ${d.status}`).join("\n")}

Write a short, plain-language summary (4-6 sentences) covering:
1. Overall spending trends
2. Any notable anomalies (unusually large amounts, repeated vendors, duplicate-looking entries)
3. One practical insight or recommendation

Do not use markdown formatting. Write in plain prose.`;

  const text = await callGroq(env, [{ role: "user", content: prompt }], false);
  return { insights: text.trim() };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const payload = await request.json();
      const action = payload.action || "extract";

      let result;
      if (action === "extract") {
        result = await handleExtract(env, payload);
      } else if (action === "insights") {
        result = await handleInsights(env, payload);
      } else {
        throw { status: 400, error: "Unknown action: " + action };
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      const status = err.status || 500;
      const body = err.error
        ? err
        : { error: "Worker error", message: err.message };
      return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};

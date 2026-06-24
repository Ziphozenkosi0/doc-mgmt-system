// Cloudflare Worker — acts as a secure middleman between our React app
// and the Groq API. The Groq API key lives here as a secret, never
// in the browser, so it can't be stolen by anyone inspecting our frontend code.
// Groq's vision model (Llama 4 Scout) reads images (JPG/PNG) — PDFs are
// converted to an image client-side before being sent here.

export default {
  async fetch(request, env) {
    // Allow our frontend to call this Worker from the browser (CORS).
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // tighten this to your real domain once deployed
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Browsers send a preflight OPTIONS request before the real POST — handle it.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { fileBase64, mimeType, docType } = await request.json();

      if (!fileBase64 || !mimeType) {
        return new Response(
          JSON.stringify({ error: "Missing fileBase64 or mimeType" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType};base64,${fileBase64}` },
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        }
      );

      const groqData = await groqResponse.json();

      if (!groqResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Groq API error", details: groqData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const rawText = groqData.choices?.[0]?.message?.content || "";
      const cleanedText = rawText.replace(/```json|```/g, "").trim();

      let extracted;
      try {
        extracted = JSON.parse(cleanedText);
      } catch {
        return new Response(
          JSON.stringify({ error: "Could not parse Groq's response", raw: rawText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ extracted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Worker error", message: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  },
};

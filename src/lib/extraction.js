// extraction.js — sends a file to our Cloudflare Worker, which calls Groq's
// vision model and returns structured data (vendor, date, amount, VAT,
// invoice number). Groq's vision model only reads images, so PDFs are
// converted to a PNG (first page) before being sent.

import { convertPdfFirstPageToImage } from "./pdfToImage";

const WORKER_URL = import.meta.env.VITE_EXTRACTION_WORKER_URL;

// Converts a File object into a base64 string (without the data: prefix),
// since that's the format we send over JSON to the Worker.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // strip "data:image/png;base64,"
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractDocumentData(file, docType) {
  // If it's a PDF, convert its first page to an image first — Groq's
  // vision model can't read PDFs directly.
  const imageFile =
    file.type === "application/pdf" ? await convertPdfFirstPageToImage(file) : file;

  const fileBase64 = await fileToBase64(imageFile);

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBase64,
      mimeType: imageFile.type,
      docType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Extraction failed");
  }

  return data.extracted; // { vendor, date, amount, vat, invoiceNumber }
}

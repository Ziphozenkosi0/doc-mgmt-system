import { convertPdfFirstPageToImage } from "./pdfToImage";

const WORKER_URL = import.meta.env.VITE_EXTRACTION_WORKER_URL;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractDocumentData(file, docType) {

  const imageFile =
    file.type === "application/pdf" ? await convertPdfFirstPageToImage(file) : file;

  const fileBase64 = await fileToBase64(imageFile);

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "extract",
      fileBase64,
      mimeType: imageFile.type,
      docType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Extraction failed");
  }

  return data.extracted;
}

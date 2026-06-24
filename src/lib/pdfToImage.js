// pdfToImage.js — converts the first page of a PDF into a PNG image,
// entirely in the browser. This lets us send PDF invoices through Groq's
// vision model, which only accepts images (JPG/PNG), not raw PDFs.

import * as pdfjsLib from "pdfjs-dist";

// Point pdf.js at its worker file, which we've copied into /public
// so Vite serves it as a static asset at the site root.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Takes a PDF File object, returns a new File object containing a PNG
// image of the PDF's first page.
export async function convertPdfFirstPageToImage(pdfFile) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // Render at a higher scale so small text (amounts, invoice numbers)
  // stays legible enough for the AI model to read accurately.
  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport }).promise;

  // Convert the canvas to a PNG Blob, then wrap it as a File so the
  // rest of our code (which expects File objects) doesn't need to change.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const imageFile = new File(
    [blob],
    pdfFile.name.replace(/\.pdf$/i, "") + ".png",
    { type: "image/png" }
  );

  return imageFile;
}

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function convertPdfFirstPageToImage(pdfFile) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport }).promise;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const imageFile = new File(
    [blob],
    pdfFile.name.replace(/\.pdf$/i, "") + ".png",
    { type: "image/png" }
  );

  return imageFile;
}

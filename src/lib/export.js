// export.js — turns a list of report documents into downloadable
// Excel (.xlsx) and PDF files, entirely in the browser.

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function docsToRows(docs) {
  return docs.map((d) => ({
    "File Name": d.fileName,
    "Document Type": d.docType === "credit_note" ? "Credit Note" : "Invoice",
    Vendor: d.extracted?.vendor || "",
    Date: d.extracted?.date || "",
    Amount: d.extracted?.amount ?? "",
    VAT: d.extracted?.vat ?? "",
    "Invoice Number": d.extracted?.invoiceNumber || "",
    Status: d.status,
    "Approval Stage": d.approvalStage,
    "Uploaded By": d.uploadedBy,
  }));
}

export function exportToExcel(docs, filename = "document-report.xlsx") {
  const rows = docsToRows(docs);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(docs, summary, filename = "document-report.pdf") {
  const pdf = new jsPDF();

  pdf.setFontSize(16);
  pdf.text("Document Report", 14, 18);

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
  pdf.text(
    `Documents: ${summary.count}  |  Total Amount: ${summary.totalAmount.toFixed(2)}  |  Total VAT: ${summary.totalVat.toFixed(2)}`,
    14,
    31
  );

  const rows = docs.map((d) => [
    d.docType === "credit_note" ? "Credit Note" : "Invoice",
    d.extracted?.vendor || "",
    d.extracted?.date || "",
    d.extracted?.amount != null ? Number(d.extracted.amount).toFixed(2) : "",
    d.extracted?.vat != null ? Number(d.extracted.vat).toFixed(2) : "",
    d.extracted?.invoiceNumber || "",
    d.status,
  ]);

  autoTable(pdf, {
    startY: 38,
    head: [["Type", "Vendor", "Date", "Amount", "VAT", "Invoice #", "Status"]],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  pdf.save(filename);
}

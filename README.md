# Document Management System

A secure, AI-powered document management system built for invoice and credit note
processing — built as a technical assessment for an AI Internship at PCG | MindRift.

## Features

- **Secure authentication** with role-based access (Admin, Reviewer, Manager,
  Finance/Admin, Viewer)
- **Document upload** for invoices and credit notes (PDF, JPG, PNG)
- **AI-powered data extraction** — automatically reads vendor, date, amount, VAT,
  and invoice number from uploaded documents
- **3-step approval workflow** — Reviewer → Manager → Finance/Admin, with
  separation of duties enforced
- **Duplicate detection** — flags documents matching an existing invoice number,
  or matching vendor + amount
- **Reports** — filter by date range, vendor, status, and amount
- **Export** — download filtered reports as Excel (.xlsx) or PDF
- **AI insights** — plain-language analysis of spending trends and anomalies

## Tech Stack

- **Frontend:** React + Vite, React Router
- **Auth & Database:** Firebase (Authentication + Firestore)
- **File Storage:** Supabase Storage
- **AI Extraction & Insights:** Groq API (Llama 4 Scout vision model), called via
  a Cloudflare Worker that keeps the API key secure
- **PDF Handling:** pdf.js (client-side PDF-to-image conversion for AI extraction)
- **Exports:** SheetJS (Excel), jsPDF (PDF)
- **Hosting:** Netlify

## Project Structure
# Document Extraction Worker

This Cloudflare Worker securely calls the Gemini API to extract data
(vendor, date, amount, VAT, invoice number) from uploaded invoice/credit
note files. It keeps the Gemini API key secret — it never appears in
frontend code.

## Setup (run these commands inside this `worker` folder)

1. Install dependencies:
   ```
   npm install
   ```

2. Log in to Cloudflare (opens a browser window to authorize):
   ```
   npx wrangler login
   ```

3. Set your Gemini API key as a secret (you'll be prompted to paste it in):
   ```
   npx wrangler secret put GEMINI_API_KEY
   ```

4. Deploy the Worker:
   ```
   npx wrangler deploy
   ```

5. After deploying, Wrangler will print a URL like:
   ```
   https://doc-mgmt-extraction.<your-subdomain>.workers.dev
   ```
   Copy that URL — we'll add it to the React app's `.env` file as
   `VITE_EXTRACTION_WORKER_URL`.

## Local testing (optional)

```
npm run dev
```
This runs the Worker locally so you can test it before deploying.

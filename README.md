# Kakeibo (かけいぼ) — Personal Finance Tracker
## AIE1F Frontend Development Project - Team 3

## Team Members

- Ho Wai Hong
- Choo Yeow Hwee
- Prancia Toh Wai Yee


## Technology

- React +  Vite
- JavaScript
- React Router v7
- Node.js

## Setup

Clone the repository:

```bash
git clone https://github.com/magcal90/aie1f-frontend-development-project.git

```

## Receipt Upload (Local Development)

Copy `.env.example` to `.env` and add your Veryfi client ID, username, and API key. Keep `.env` private; it is ignored by Git. The React app sends receipt images to a local Node endpoint, which forwards them to Veryfi without exposing credentials in the browser.

Run the transaction API, receipt API, and Vite app in separate terminals:

```bash
npm run server
npm run receipt-api
npm run dev
```

Receipt images up to 4 MB are accepted (Netlify Functions limit request bodies to 6 MB, and base64 encoding adds ~33%). The parsed merchant, total, and date prefill the new transaction form for review; the transaction is only saved when you submit the form.

## Receipt Upload (Netlify Deployment)

On Netlify, the receipt endpoint runs as a serverless function (`netlify/functions/receipt-parse.js`) instead of a Node server. `netlify.toml` routes `/api/receipt/parse` to that function, so the frontend code is unchanged. Both the local server and the function share the same logic in `server/parse-receipt.js`.

In the Netlify dashboard, go to **Site configuration → Environment variables** and add `VERYFI_CLIENT_ID`, `VERYFI_USERNAME`, and `VERYFI_API_KEY` (scope: Functions), then redeploy.
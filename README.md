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

Receipt images up to 10 MB are accepted. The parsed merchant, total, and date prefill the new transaction form for review; the transaction is only saved when you submit the form.
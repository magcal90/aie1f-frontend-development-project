import { createHash } from "node:crypto";

// Shared by the local receipt API (server/receipt-api.js) and the Netlify Function.
// Netlify caps synchronous function request bodies at 6 MB, and base64 adds ~33%.
export const MAX_FILE_SIZE = 4 * 1024 * 1024;
const VERYFI_URL = "https://api.veryfi.com/api/v8/partner/documents";
const VERYFI_TIMEOUT_MS = 25_000;

function getFieldValue(field) {
  if (field && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
}

export async function parseReceipt(payload, env) {
  try {
    const { fileData, fileName } = payload ?? {};
    const match =
      typeof fileData === "string" &&
      fileData.match(/^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

    if (!match || typeof fileName !== "string" || !fileName.trim()) {
      return { status: 400, body: { error: "Upload a valid receipt image." } };
    }

    const fileBytes = Buffer.from(match[2], "base64");
    if (fileBytes.byteLength > MAX_FILE_SIZE) {
      return { status: 413, body: { error: "The image must be 4 MB or smaller." } };
    }

    const { VERYFI_CLIENT_ID, VERYFI_USERNAME, VERYFI_API_KEY } = env;
    if (!VERYFI_CLIENT_ID || !VERYFI_USERNAME || !VERYFI_API_KEY) {
      return {
        status: 503,
        body: { error: "Receipt scanning is not configured. Veryfi credentials are missing." },
      };
    }

    const veryfiResponse = await fetch(VERYFI_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "CLIENT-ID": VERYFI_CLIENT_ID,
        Authorization: `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`,
        // Same image => same key, so a retry after a timeout returns the original document instead of a billed duplicate.
        "Idempotency-Key": createHash("sha256").update(fileBytes).digest("hex"),
      },
      body: JSON.stringify({ file_data: fileData, file_name: fileName }),
      signal: AbortSignal.timeout(VERYFI_TIMEOUT_MS),
    });

    if (!veryfiResponse.ok) {
      return {
        status: 502,
        body: { error: `Veryfi could not process the receipt (HTTP ${veryfiResponse.status}).` },
      };
    }

    const document = await veryfiResponse.json();
    const merchant = getFieldValue(document.vendor?.name ?? document.vendor);
    const amountValue = getFieldValue(document.total);
    const amount = amountValue == null ? null : Number(amountValue);
    const dateValue = getFieldValue(document.date);
    const date = typeof dateValue === "string" ? dateValue.slice(0, 10) : "";

    return {
      status: 200,
      body: {
        merchant: typeof merchant === "string" ? merchant.trim() : "",
        amount: Number.isFinite(amount) ? amount : null,
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      },
    };
  } catch (error) {
    if (error.name === "TimeoutError") {
      return {
        status: 504,
        body: { error: "Receipt parsing timed out. Try again with a clearer or smaller image." },
      };
    }
    return {
      status: 400,
      body: { error: "Could not parse the receipt. Check the image and try again." },
    };
  }
}

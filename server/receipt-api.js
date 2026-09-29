import { createServer } from "node:http";

const PORT = Number(process.env.RECEIPT_API_PORT || 3002);
const MAX_REQUEST_SIZE = 14 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VERYFI_URL = "https://api.veryfi.com/api/v8/partner/documents";

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_REQUEST_SIZE) {
      const error = new Error("The image must be 10 MB or smaller.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getFieldValue(field) {
  if (field && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return field;
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  if (request.method !== "POST" || requestUrl.pathname !== "/api/receipt/parse") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  try {
    const { fileData, fileName } = await readJson(request);
    const match =
      typeof fileData === "string" &&
      fileData.match(/^data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

    if (!match || typeof fileName !== "string" || !fileName.trim()) {
      sendJson(response, 400, { error: "Upload a valid receipt image." });
      return;
    }

    if (Buffer.from(match[2], "base64").byteLength > MAX_FILE_SIZE) {
      sendJson(response, 413, { error: "The image must be 10 MB or smaller." });
      return;
    }

    const { VERYFI_CLIENT_ID, VERYFI_USERNAME, VERYFI_API_KEY } = process.env;
    if (!VERYFI_CLIENT_ID || !VERYFI_USERNAME || !VERYFI_API_KEY) {
      sendJson(response, 503, {
        error: "Add your Veryfi credentials to .env and restart the receipt API.",
      });
      return;
    }

    const veryfiResponse = await fetch(VERYFI_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "CLIENT-ID": VERYFI_CLIENT_ID,
        Authorization: `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`,
      },
      body: JSON.stringify({ file_data: fileData, file_name: fileName }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!veryfiResponse.ok) {
      sendJson(response, 502, {
        error: `Veryfi could not process the receipt (HTTP ${veryfiResponse.status}).`,
      });
      return;
    }

    const document = await veryfiResponse.json();
    const merchant = getFieldValue(document.vendor?.name ?? document.vendor);
    const amountValue = getFieldValue(document.total);
    const amount = amountValue == null ? null : Number(amountValue);
    const dateValue = getFieldValue(document.date);
    const date = typeof dateValue === "string" ? dateValue.slice(0, 10) : "";

    sendJson(response, 200, {
      merchant: typeof merchant === "string" ? merchant.trim() : "",
      amount: Number.isFinite(amount) ? amount : null,
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    });
  } catch (error) {
    const status = error.status || (error.name === "TimeoutError" ? 504 : 400);
    const message =
      status === 504
        ? "Receipt parsing timed out. Try again with a clearer or smaller image."
        : status === 413
          ? error.message
          : "Could not parse the receipt. Check the image and try again.";
    sendJson(response, status, { error: message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Receipt API listening on http://127.0.0.1:${PORT}`);
});
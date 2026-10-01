import { createServer } from "node:http";
import { MAX_FILE_SIZE, parseReceipt } from "./parse-receipt.js";

const PORT = Number(process.env.RECEIPT_API_PORT || 3002);
const MAX_REQUEST_SIZE = Math.ceil(MAX_FILE_SIZE * 1.4);

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
      const error = new Error("The image must be 4 MB or smaller.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  if (request.method !== "POST" || requestUrl.pathname !== "/api/receipt/parse") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    const status = error.status || 400;
    sendJson(response, status, {
      error: status === 413 ? error.message : "Upload a valid receipt image.",
    });
    return;
  }

  const { status, body } = await parseReceipt(payload, process.env);
  sendJson(response, status, body);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Receipt API listening on http://127.0.0.1:${PORT}`);
});
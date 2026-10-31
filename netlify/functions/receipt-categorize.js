import { categorizeReceipt, MAX_CATEGORIZATION_REQUEST_SIZE } from "../../server/categorize-receipt.js";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  let payload;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > MAX_CATEGORIZATION_REQUEST_SIZE) {
      return Response.json({ error: "Category suggestion request is too large." }, { status: 413 });
    }
    payload = JSON.parse(text);
  } catch {
    return Response.json({ error: "Supply a valid category suggestion request." }, { status: 400 });
  }
  const { status, body } = await categorizeReceipt(payload, process.env);
  return Response.json(body, { status });
};
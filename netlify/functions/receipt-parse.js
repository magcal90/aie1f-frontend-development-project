import { parseReceipt } from "../../server/parse-receipt.js";

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Upload a valid receipt image." }, { status: 400 });
  }

  const { status, body } = await parseReceipt(payload, process.env);
  return Response.json(body, { status });
};

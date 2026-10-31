// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { categorizeReceipt } from "./categorize-receipt.js";
import handler from "../netlify/functions/receipt-categorize.js";

const env = { TYPESAFE_API_KEY: "test-key" };
const payload = {
  merchant: "Shop",
  items: [{ id: "apples", description: "Apples" }, { id: "soap", description: "Soap" }],
  categories: [
    { id: "food", name: "Food", type: "expense", description: "Groceries and meals" },
    { id: "home", name: "Home", type: "expense" },
  ],
};

function answer(choice, confidence, probabilities) {
  return { type: "choice", choice, confidence, probabilities };
}

function mockAnswers(answers) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ model: "jev-test", answers }) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Jev receipt categories", () => {
  it("routes Netlify POST requests through the shared classifier", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    mockAnswers({
      purchase_0: answer("category_0", 1, { category_0: 1, category_1: 0, unclassified: 0 }),
      purchase_1: answer("category_1", 1, { category_0: 0, category_1: 1, unclassified: 0 }),
    });
    const response = await handler(new Request("http://localhost/api/receipt/categorize", {
      method: "POST", body: JSON.stringify(payload),
    }));
    expect(response.status).toBe(200);
    expect((await response.json()).suggestions).toHaveLength(2);
  });

  it("rejects non-POST, malformed JSON, and oversized Netlify requests", async () => {
    expect((await handler(new Request("http://localhost"))).status).toBe(404);
    expect((await handler(new Request("http://localhost", { method: "POST", body: "invalid" }))).status).toBe(400);
    expect((await handler(new Request("http://localhost", { method: "POST", body: "x".repeat(256 * 1024 + 1) }))).status).toBe(413);
  });

  it("asks all purchase questions together and maps confident and uncertain choices to existing IDs", async () => {
    const fetchMock = mockAnswers({
      purchase_0: answer("category_0", 0.925, { category_0: 0.95, category_1: 0.03, unclassified: 0.02 }),
      purchase_1: answer("category_1", 0.175, { category_0: 0.35, category_1: 0.45, unclassified: 0.2 }),
    });
    const result = await categorizeReceipt(payload, env);
    expect(result.status).toBe(200);
    expect(result.body.suggestions).toEqual([
      expect.objectContaining({ itemId: "apples", categoryId: "food", confidence: 0.925, probability: 0.95, autoApply: true }),
      expect.objectContaining({ itemId: "soap", categoryId: "home", autoApply: false }),
    ]);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(request.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(request.body);
    expect(body.model).toBe("jev-latest");
    expect(body.questions.purchase_0.criteria.category_0.description).toBe("Groceries and meals");
    expect(Object.keys(body.questions)).toEqual(["purchase_0", "purchase_1"]);
    expect(body.state).toEqual({ merchant: "Shop", purchases: [{ description: "Apples" }, { description: "Soap" }] });
    expect(JSON.stringify(result.body)).not.toContain("test-key");
  });

  it("leaves unclassified choices unset", async () => {
    mockAnswers({ purchase_0: answer("unclassified", 1, { category_0: 0, category_1: 0, unclassified: 1 }) });
    const result = await categorizeReceipt({ ...payload, items: payload.items.slice(0, 1) }, env);
    expect(result.body.suggestions[0]).toMatchObject({ categoryId: null, autoApply: false });
  });

  it("does not call the provider for missing credentials or invalid payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await categorizeReceipt(payload, {})).status).toBe(503);
    for (const invalid of [
      { ...payload, items: [] }, { ...payload, items: [payload.items[0], payload.items[0]] },
      { ...payload, categories: [{ ...payload.categories[0], type: "income" }] },
      { ...payload, categories: [payload.categories[0], payload.categories[0]] },
    ]) expect((await categorizeReceipt(invalid, env)).status).toBe(400);
    expect((await categorizeReceipt(payload, { ...env, TYPESAFE_MIN_CONFIDENCE: "invalid" })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    answer("unknown", 1, { category_0: 1, category_1: 0, unclassified: 0 }),
    answer("category_0", 2, { category_0: 1, category_1: 0, unclassified: 0 }),
    answer("category_0", 1, { category_0: 1, category_1: 0.3, unclassified: 0 }),
    answer("category_0", 0.5, { category_0: 0.1, category_1: 0.8, unclassified: 0.1 }),
  ])("rejects malformed or inconsistent provider answers (%#)", async (invalidAnswer) => {
    mockAnswers({ purchase_0: invalidAnswer });
    expect((await categorizeReceipt({ ...payload, items: payload.items.slice(0, 1) }, env)).status).toBe(502);
  });

  it("handles provider errors and timeouts without exposing provider details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    expect((await categorizeReceipt(payload, env)).status).toBe(502);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("secret"), { name: "TimeoutError" })));
    const result = await categorizeReceipt(payload, env);
    expect(result.status).toBe(504);
    expect(result.body.error).not.toContain("secret");
  });
});
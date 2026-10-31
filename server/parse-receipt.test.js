// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseReceipt } from "./parse-receipt.js";

const payload = { fileData: "data:image/png;base64,aGVsbG8=", fileName: "receipt.png" };
const env = { VERYFI_CLIENT_ID: "client", VERYFI_USERNAME: "user", VERYFI_API_KEY: "test" };

afterEach(() => vi.unstubAllGlobals());

describe("Veryfi receipt extraction", () => {
  it("preserves line totals and normalizes ordinary and detailed fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vendor: { name: " Shop " }, total: { value: "10.90" },
        date: "2026-11-01T12:00:00", currency_code: "SGD", subtotal: 10,
        tax: { value: 0.9 }, discount: 1,
        line_items: [
          { description: " Apples ", quantity: 2, price: 3, total: 6 },
          { description: { value: "Soap" }, total: { value: "4" }, discount: 1 },
          { description: "Unreadable price", total: "unknown" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await parseReceipt(payload, env);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ merchant: "Shop", amount: 10.9, tax: 0.9, discount: 1, currency: "SGD" });
    expect(result.body.items).toEqual([
      { description: "Apples", quantity: 2, unitPrice: 3, amount: 6, tax: null, discount: null },
      { description: "Soap", quantity: null, unitPrice: null, amount: 4, tax: null, discount: 1 },
      { description: "Unreadable price", quantity: null, unitPrice: null, amount: null, tax: null, discount: null },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.veryfi.com/api/v8/partner/documents");
  });

  it("retains total-only receipts when no items are available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ total: 5 }) }));
    expect((await parseReceipt(payload, env)).body.items).toEqual([]);
  });

  it("rejects invalid uploads before calling Veryfi", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await parseReceipt({}, env)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
import { describe, expect, it } from "vitest";
import { reconcileReceiptItems, toCents } from "./receiptItems";

describe("receipt reconciliation", () => {
  it("allocates extra tax proportionally", () => {
    expect(reconcileReceiptItems([{ amount: 6 }, { amount: 4 }], 10.9)).toEqual({
      itemTotal: 10, adjustment: 0.9, amounts: [6.54, 4.36],
    });
  });
  it("does not add tax again to inclusive prices", () => {
    expect(reconcileReceiptItems([{ amount: 6.54 }, { amount: 4.36 }], 10.9).amounts).toEqual([6.54, 4.36]);
  });
  it("allocates discounts with deterministic remainder cents", () => {
    const result = reconcileReceiptItems([{ amount: 1 }, { amount: 1 }, { amount: 1 }], 2);
    expect(result.amounts).toEqual([0.67, 0.67, 0.66]);
    expect(result.adjustment).toBe(-1);
    expect(result.amounts.reduce((sum, amount) => sum + toCents(amount), 0)).toBe(200);
  });
  it("preserves free items and rejects invalid or negative lines", () => {
    expect(reconcileReceiptItems([{ amount: 0 }, { amount: 10 }], 9).amounts).toEqual([0, 9]);
    for (const amount of ["", null, "invalid", -1, 1.001]) {
      expect(reconcileReceiptItems([{ amount }], 10).error).toBeTruthy();
    }
    expect(reconcileReceiptItems([], 10).error).toBeTruthy();
    expect(reconcileReceiptItems([{ amount: 1 }], "").error).toBeTruthy();
  });
});
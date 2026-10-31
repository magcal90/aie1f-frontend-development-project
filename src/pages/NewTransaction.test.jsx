import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionContext } from "../contexts/TransactionContext";
import NewTransaction from "./NewTransaction";

const categories = [
  { id: "food", name: "Food", type: "expense" },
  { id: "home", name: "Home", type: "expense" },
];
const receipt = {
  merchant: "Shop", date: "2026-11-01", amount: 10.9, tax: 0.9, subtotal: 10,
  discount: 0, currency: "SGD",
  items: [{ description: "Apples", amount: 6, quantity: 2, unitPrice: 3 }, { description: "Soap", amount: 4 }],
};

afterEach(() => vi.unstubAllGlobals());

async function scan(parsedReceipt = receipt, addTransactions = vi.fn().mockResolvedValue({ saved: [], error: null })) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => parsedReceipt }));
  render(<MemoryRouter><TransactionContext.Provider value={{ categories, submitting: false, addTransaction: vi.fn(), addTransactions }}>
    <NewTransaction />
  </TransactionContext.Provider></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Receipt image"), {
    target: { files: [new File(["image"], "receipt.png", { type: "image/png" })] },
  });
  await screen.findByText("Receipt scanned. Review the details before saving.");
  return addTransactions;
}

function review() {
  const categoryInputs = screen.getAllByLabelText("Category");
  fireEvent.change(categoryInputs[0], { target: { value: "food" } });
  fireEvent.change(categoryInputs[1], { target: { value: "home" } });
  fireEvent.click(screen.getByLabelText(/I verified all purchases/));
}

function mockSuggestions(suggestions) {
  const fetchMock = vi.fn().mockImplementation(async (url, request) => {
    const items = JSON.parse(request.body).items;
    return { ok: true, json: async () => ({ model: "jev-test", suggestions: suggestions.map((suggestion, index) => ({
      ...suggestion, itemId: items[index].id,
    })) }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Jev category suggestions", () => {
  it("prefills only confident blank categories and requires review", async () => {
    const save = await scan();
    const fetchMock = mockSuggestions([
      { categoryId: "food", confidence: 0.925, probability: 0.95, autoApply: true },
      { categoryId: "home", confidence: 0.175, probability: 0.45, autoApply: false },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Category suggestions ready.");
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("food");
    expect(screen.getAllByLabelText("Category")[1]).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save Purchases" })).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/receipt/categorize");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("fileData");
    fireEvent.click(screen.getByRole("button", { name: "Use Jev suggestion for purchase 2" }));
    expect(screen.getAllByLabelText("Category")[1]).toHaveValue("home");
    fireEvent.click(screen.getByLabelText(/I verified all purchases/));
    fireEvent.click(screen.getByRole("button", { name: "Save Purchases" }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0][0]).toMatchObject({ receiptCategorySource: "jev", receiptCategorySuggestion: {
      model: "jev-test", categoryId: "food", confidence: 0.925, probability: 0.95,
    } });
    expect(save.mock.calls[0][0][1].receiptCategorySource).toBe("jev-reviewed");
  });

  it("preserves manual categories and leaves unclassified purchases unset", async () => {
    await scan();
    fireEvent.change(screen.getAllByLabelText("Category")[0], { target: { value: "home" } });
    mockSuggestions([
      { categoryId: "food", confidence: 1, probability: 1, autoApply: true },
      { categoryId: null, confidence: 1, probability: 1, autoApply: false },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Category suggestions ready.");
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("home");
    expect(screen.getAllByLabelText("Category")[1]).toHaveValue("");
    expect(screen.getByText(/Jev: Unclassified/)).toBeInTheDocument();
  });

  it("invalidates AI categories after description or merchant changes but keeps manual choices", async () => {
    await scan();
    mockSuggestions([
      { categoryId: "food", confidence: 1, probability: 1, autoApply: true },
      { categoryId: "home", confidence: 1, probability: 1, autoApply: true },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Category suggestions ready.");
    fireEvent.change(screen.getByLabelText("Purchase 1"), { target: { value: "Stationery" } });
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("");
    expect(screen.queryByText(/Jev: Food/)).not.toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText("Category")[0], { target: { value: "home" } });
    fireEvent.change(screen.getByLabelText("Merchant"), { target: { value: "New shop" } });
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("home");
    expect(screen.getAllByLabelText("Category")[1]).toHaveValue("");
  });

  it("falls back to manual categorization when Jev is unavailable", async () => {
    await scan();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "TYPESAFE_API_KEY is missing." }) }));
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("TYPESAFE_API_KEY is missing.");
    review();
    expect(screen.getByRole("button", { name: "Save Purchases" })).toBeEnabled();
  });

  it("clears outdated automatic choices when refreshed suggestions become uncertain", async () => {
    await scan();
    mockSuggestions([
      { categoryId: "food", confidence: 1, probability: 1, autoApply: true },
      { categoryId: "home", confidence: 1, probability: 1, autoApply: true },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Category suggestions ready.");
    fireEvent.change(screen.getAllByLabelText("Category")[1], { target: { value: "food" } });
    mockSuggestions([
      { categoryId: "home", confidence: 0.2, probability: 0.45, autoApply: false },
      { categoryId: "home", confidence: 0.2, probability: 0.45, autoApply: false },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Category suggestions ready.");
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("");
    expect(screen.getAllByLabelText("Category")[1]).toHaveValue("food");
  });

  it("rejects incomplete suggestion responses without modifying categories", async () => {
    await scan();
    mockSuggestions([
      { categoryId: "food", autoApply: true },
      { categoryId: "home", confidence: 1, probability: 1, autoApply: true },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Suggest Categories" }));
    await screen.findByText("Invalid category suggestions. Choose categories manually.");
    expect(screen.getAllByLabelText("Category")[0]).toHaveValue("");
  });
});

describe("receipt purchase review", () => {
  it("requires review and saves separately categorized items reconciled to the total", async () => {
    const save = await scan();
    expect(screen.getByRole("button", { name: "Save Purchases" })).toBeDisabled();
    review();
    fireEvent.click(screen.getByRole("button", { name: "Save Purchases" }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual([
      expect.objectContaining({ description: "Apples", amount: 6.54, categoryId: "food", receiptLineAmount: 6 }),
      expect.objectContaining({ description: "Soap", amount: 4.36, categoryId: "home", receiptLineAmount: 4 }),
    ]);
    expect(save.mock.calls[0][0][0].receiptId).toBe(save.mock.calls[0][0][1].receiptId);
  });

  it("resets review after editing and supports adding and removing rows", async () => {
    await scan();
    review();
    fireEvent.change(screen.getByLabelText("Purchase 1"), { target: { value: "Fruit" } });
    expect(screen.getByLabelText(/I verified all purchases/)).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Add purchase" }));
    expect(screen.getByLabelText("Purchase 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove purchase 3" }));
    expect(screen.queryByLabelText("Purchase 3")).not.toBeInTheDocument();
  });

  it("retries only unsaved purchases after a partial failure", async () => {
    const save = vi.fn().mockImplementationOnce(async (drafts) => ({ saved: [drafts[0]], error: "Server error" }))
      .mockResolvedValueOnce({ saved: [], error: null });
    await scan(receipt, save);
    review();
    fireEvent.click(screen.getByRole("button", { name: "Save Purchases" }));
    await screen.findByText("1 purchases saved.");
    expect(screen.getByLabelText("Receipt total")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry Remaining Purchases" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1][0]).toHaveLength(1);
    expect(save.mock.calls[1][0][0].description).toBe("Soap");
  });

  it("blocks retries when a failed save cannot be verified", async () => {
    await scan(receipt, vi.fn().mockResolvedValue({ saved: [], error: "Network failure", uncertain: true }));
    review();
    fireEvent.click(screen.getByRole("button", { name: "Save Purchases" }));
    await screen.findByText(/Save status could not be verified/);
    expect(screen.getByRole("button", { name: "Save Purchases" })).toBeDisabled();
  });

  it("keeps total-only receipts on the existing single-transaction form", async () => {
    await scan({ ...receipt, items: [] });
    expect(screen.getByRole("button", { name: "Save Transaction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue(10.9);
    expect(screen.getByLabelText("Save individual purchases")).not.toBeChecked();
  });
});